import base64

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerOut, CustomerUpdate

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=list[CustomerOut])
def list_customers(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return db.query(Customer).order_by(Customer.name).all()


@router.post("", response_model=CustomerOut, status_code=201)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    customer = Customer(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer


# ---- business card photo ---------------------------------------------------------
MAX_CARD_BYTES = 5 * 1024 * 1024  # 5 MB
CARD_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _get_customer(db: Session, customer_id: int) -> Customer:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.post("/{customer_id}/card", response_model=CustomerOut)
async def upload_card(
    customer_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Attach (or replace) the photo of the customer's business card."""
    customer = _get_customer(db, customer_id)
    if file.content_type not in CARD_TYPES:
        raise HTTPException(status_code=400, detail="Please upload a JPEG, PNG or WEBP image")
    content = await file.read()
    if len(content) > MAX_CARD_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 5MB)")

    customer.card_image = f"data:{file.content_type};base64,{base64.b64encode(content).decode()}"
    customer.has_card = True
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{customer_id}/card")
def get_card(
    customer_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """The business card photo itself (kept out of the customer list so that stays small)."""
    customer = _get_customer(db, customer_id)
    if not customer.card_image:
        raise HTTPException(status_code=404, detail="No business card uploaded for this customer")
    header, payload = customer.card_image.split(",", 1)
    media_type = header[5:].split(";")[0] or "image/jpeg"
    return Response(content=base64.b64decode(payload), media_type=media_type, headers={"Cache-Control": "private, max-age=60"})


@router.delete("/{customer_id}/card", response_model=CustomerOut)
def delete_card(
    customer_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    customer = _get_customer(db, customer_id)
    customer.card_image = None
    customer.has_card = False
    db.commit()
    db.refresh(customer)
    return customer
