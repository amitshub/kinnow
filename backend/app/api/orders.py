import base64

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_db, require_admin
from app.crud.codes import next_code
from app.models.customer import Customer
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User, UserRole
from app.schemas.order import ChallanUpdate, OrderCreate, OrderOut, StatusUpdate
from app.services.whatsapp import send_order_assigned_notification

router = APIRouter(prefix="/orders", tags=["orders"])


def _ensure_order_access(current_user: User, order: Order) -> None:
    if current_user.role != UserRole.admin and current_user.packhouse_id != order.packhouse_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")


@router.get("", response_model=list[OrderOut])
def list_orders(
    status_filter: OrderStatus | None = None,
    packhouse_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Admins see all orders by default (optionally filtered to one packhouse
    via `packhouse_id`). Packhouse staff always see only their own orders —
    this is how staff find orders assigned to them and update status/dispatch.
    """
    q = db.query(Order).options(
        joinedload(Order.items), joinedload(Order.packhouse), joinedload(Order.customer)
    )
    if current_user.role != UserRole.admin:
        q = q.filter(Order.packhouse_id == current_user.packhouse_id)
    elif packhouse_id:
        q = q.filter(Order.packhouse_id == packhouse_id)

    if status_filter:
        q = q.filter(Order.status == status_filter)
    return q.order_by(Order.order_date.desc(), Order.id.desc()).all()


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    packhouse_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Add at least one item")

    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    order = Order(
        code=next_code(db, Order, "ORD-", 4),
        customer_id=payload.customer_id,
        packhouse_id=packhouse_id,
        order_date=payload.order_date,
        status=OrderStatus.pending,
        remarks=payload.remarks,
        truck_tonnage=payload.truck_tonnage,
    )
    db.add(order)
    db.flush()  # get order.id for items

    for item in payload.items:
        db.add(
            OrderItem(
                order_id=order.id,
                brand=item.brand,
                variety=item.variety,
                quality=item.quality,
                qty=item.qty,
                rate=item.rate,
            )
        )

    db.commit()
    db.refresh(order)

    background_tasks.add_task(send_order_assigned_notification, order.id)

    return order


@router.put("/{order_id}", response_model=OrderOut)
def update_order(
    order_id: int,
    payload: OrderCreate,
    packhouse_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Admins can fully edit an order (including reassigning its packhouse)
    only while it's still Pending."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != OrderStatus.pending:
        raise HTTPException(status_code=400, detail="Only pending orders can be edited")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Add at least one item")

    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    order.customer_id = payload.customer_id
    order.packhouse_id = packhouse_id
    order.order_date = payload.order_date
    order.remarks = payload.remarks
    order.truck_tonnage = payload.truck_tonnage

    db.query(OrderItem).filter(OrderItem.order_id == order.id).delete()
    for item in payload.items:
        db.add(
            OrderItem(
                order_id=order.id,
                brand=item.brand,
                variety=item.variety,
                quality=item.quality,
                qty=item.qty,
                rate=item.rate,
            )
        )

    db.commit()
    db.refresh(order)
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Admins can delete an order only while it's still Pending."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != OrderStatus.pending:
        raise HTTPException(status_code=400, detail="Only pending orders can be deleted")

    db.delete(order)
    db.commit()
    return None


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_status(
    order_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    _ensure_order_access(current_user, order)

    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order


@router.patch("/{order_id}/challan", response_model=OrderOut)
def update_challan(
    order_id: int,
    payload: ChallanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fill in dispatch/challan details (packhouse staff do this). Also marks the order Dispatched."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    _ensure_order_access(current_user, order)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(order, field, value)
    order.status = OrderStatus.dispatched

    db.commit()
    db.refresh(order)
    return order


MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_UPLOAD_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}


@router.post("/{order_id}/upload", response_model=OrderOut)
async def upload_order_file(
    order_id: int,
    field: str = Query(..., pattern="^(bilty|kaanta)$"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a photo (camera or gallery) or PDF for the bilty/kaanta parchi.
    Stored as a base64 data URI directly on the order row — no separate file
    storage is configured, and this keeps things simple for modest file sizes."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    _ensure_order_access(current_user, order)

    if file.content_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG/PNG/WEBP images or PDF files are allowed")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 5MB)")

    data_uri = f"data:{file.content_type};base64,{base64.b64encode(content).decode()}"
    setattr(order, field, data_uri)

    db.commit()
    db.refresh(order)
    return order
