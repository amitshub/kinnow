from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_db, require_admin, resolve_packhouse_id
from app.crud.codes import next_code
from app.models.grower import Grower
from app.models.payment import PaymentRequest, PaymentStatus
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentOut

router = APIRouter(prefix="/payments", tags=["payments"])


def _to_out(p: PaymentRequest) -> PaymentOut:
    return PaymentOut(
        id=p.id,
        code=p.code,
        grower_id=p.grower_id,
        grower_name=p.grower.name if p.grower else "",
        account=p.account,
        packhouse_id=p.packhouse_id,
        amount=p.amount,
        request_date=p.request_date,
        status=p.status,
        note=p.note,
    )


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
    q = db.query(PaymentRequest).options(joinedload(PaymentRequest.grower))

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
