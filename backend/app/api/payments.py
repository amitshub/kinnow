from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_db, require_admin, resolve_packhouse_id
from app.crud.codes import next_code
from app.models.grower import Grower
from app.models.packhouse import Packhouse
from app.models.payment import PaymentRequest, PaymentStatus
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentOut
from app.services.payments_pdf import build_payments_pdf

router = APIRouter(prefix="/payments", tags=["payments"])


def _to_out(p: PaymentRequest) -> PaymentOut:
    return PaymentOut(
        id=p.id,
        code=p.code,
        grower_id=p.grower_id,
        grower_name=p.grower.name if p.grower else "",
        grower_city=p.grower.city if p.grower else None,
        account=p.account,
        account_number=p.grower.account_number if p.grower else None,  # live values from the grower's profile
        ifsc_code=p.grower.ifsc_code if p.grower else None,
        packhouse_id=p.packhouse_id,
        packhouse_name=p.packhouse.name if p.packhouse else "",
        amount=p.amount,
        request_date=p.request_date,
        status=p.status,
        note=p.note,
    )


@router.get("/pdf")
def payments_pdf(
    day: date_type | None = Query(None, alias="date"),
    status_filter: PaymentStatus | None = Query(None, alias="status"),
    packhouse_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """The Payments list as a PDF: Packhouse | Account name | A/c no. | IFSC | Amount, with a total.
    Takes the same filters as the screen (date, status, packhouse); leave one out to include all.
    Packhouse users always get only their own packhouse."""
    if current_user.role != "admin":
        packhouse_id = current_user.packhouse_id
    q = db.query(PaymentRequest).options(joinedload(PaymentRequest.grower), joinedload(PaymentRequest.packhouse))
    if day:
        q = q.filter(PaymentRequest.request_date == day)
    if status_filter:
        q = q.filter(PaymentRequest.status == status_filter)
    packhouse_name = "All packhouses"
    if packhouse_id:
        q = q.filter(PaymentRequest.packhouse_id == packhouse_id)
        ph = db.query(Packhouse).filter(Packhouse.id == packhouse_id).first()
        packhouse_name = ph.name if ph else f"#{packhouse_id}"

    pdf = build_payments_pdf(
        q.all(),
        date_text=day.strftime("%d-%m-%Y") if day else "All dates",
        status_text=status_filter.value if status_filter else "All",
        packhouse_text=packhouse_name,
    )
    name = f"Payments_{day.strftime('%d-%m-%Y') if day else 'All_dates'}.pdf"
    return Response(content=pdf, media_type="application/pdf", headers={"Content-Disposition": f'inline; filename="{name}"'})


@router.get("", response_model=list[PaymentOut])
def list_payments(
    packhouse_id: int | None = None,
    status_filter: PaymentStatus | None = None,
    all_packhouses: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Staff: always scoped to their own packhouse (the "Payment Requests" view).
    Admin: pass `all_packhouses=true` for the "Admin - All Payments" view,
    or a specific `packhouse_id` to filter to one.
    """
    q = db.query(PaymentRequest).options(joinedload(PaymentRequest.grower), joinedload(PaymentRequest.packhouse))

    if current_user.role == "admin" and all_packhouses:
        pass  # no packhouse filter — admin sees everything
    else:
        ph_id = resolve_packhouse_id(current_user, packhouse_id)
        q = q.filter(PaymentRequest.packhouse_id == ph_id)

    if status_filter:
        q = q.filter(PaymentRequest.status == status_filter)

    rows = q.order_by(PaymentRequest.request_date.desc()).all()
    return [_to_out(p) for p in rows]


@router.post("", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment(
    payload: PaymentCreate,
    packhouse_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ph_id = resolve_packhouse_id(current_user, packhouse_id)
    grower = db.query(Grower).filter(Grower.id == payload.grower_id).first()
    if not grower:
        raise HTTPException(status_code=404, detail="Grower not found")

    payment = PaymentRequest(
        code=next_code(db, PaymentRequest, "PAY", 4),
        grower_id=payload.grower_id,
        packhouse_id=ph_id,
        account=grower.account,
        amount=payload.amount,
        request_date=payload.request_date,
        status=PaymentStatus.pending,
        note=payload.note,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return _to_out(payment)


@router.post("/{payment_id}/approve", response_model=PaymentOut)
def approve_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    payment = db.query(PaymentRequest).filter(PaymentRequest.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment request not found")
    payment.status = PaymentStatus.approved
    db.commit()
    db.refresh(payment)
    return _to_out(payment)


@router.post("/{payment_id}/reject", response_model=PaymentOut)
def reject_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    payment = db.query(PaymentRequest).filter(PaymentRequest.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment request not found")
    payment.status = PaymentStatus.rejected
    db.commit()
    db.refresh(payment)
    return _to_out(payment)
