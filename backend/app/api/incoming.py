from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_db, resolve_packhouse_id
from app.crud.codes import next_code
from app.models.grower import Grower
from app.models.incoming import IncomingRecord
from app.models.user import User
from app.schemas.incoming import IncomingCreate, IncomingOut, IncomingUpdate

router = APIRouter(prefix="/incoming", tags=["incoming"])


def _to_out(record: IncomingRecord) -> IncomingOut:
    return IncomingOut(
        id=record.id,
        code=record.code,
        grower_id=record.grower_id,
        grower_name=record.grower.name if record.grower else "",
        grower_city=record.grower.city if record.grower else None,
        packhouse_id=record.packhouse_id,
        weight=record.weight,
        price=record.price,
        amount=record.amount,
        record_date=record.record_date,
        record_time=record.record_time,
    )


@router.get("", response_model=list[IncomingOut])
def list_incoming(
    record_date: date | None = None,
    packhouse_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ph_id = resolve_packhouse_id(current_user, packhouse_id)
    q = (
        db.query(IncomingRecord)
        .options(joinedload(IncomingRecord.grower))
        .filter(IncomingRecord.packhouse_id == ph_id)
    )
    if record_date:
        q = q.filter(IncomingRecord.record_date == record_date)
    records = q.order_by(IncomingRecord.record_time.desc().nullslast()).all()
    return [_to_out(r) for r in records]


@router.post("", response_model=IncomingOut, status_code=status.HTTP_201_CREATED)
def create_incoming(
    payload: IncomingCreate,
    packhouse_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ph_id = resolve_packhouse_id(current_user, packhouse_id)
    grower = db.query(Grower).filter(Grower.id == payload.grower_id).first()
    if not grower:
        raise HTTPException(status_code=404, detail="Grower not found")

    amount = payload.amount if payload.amount is not None else payload.weight * payload.price

    record = IncomingRecord(
        code=next_code(db, IncomingRecord, "IN", 4),
        grower_id=payload.grower_id,
        packhouse_id=ph_id,
        weight=payload.weight,
        price=payload.price,
        amount=amount,
        record_date=payload.record_date,
        record_time=payload.record_time,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _to_out(record)


@router.put("/{record_id}", response_model=IncomingOut)
def update_incoming(
    record_id: int,
    payload: IncomingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(IncomingRecord).filter(IncomingRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Incoming record not found")
    _ensure_access(current_user, record.packhouse_id)

    grower = db.query(Grower).filter(Grower.id == payload.grower_id).first()
    if not grower:
        raise HTTPException(status_code=404, detail="Grower not found")

    amount = payload.amount if payload.amount is not None else payload.weight * payload.price

    record.grower_id = payload.grower_id
    record.weight = payload.weight
    record.price = payload.price
    record.amount = amount
    record.record_date = payload.record_date
    record.record_time = payload.record_time

    db.commit()
    db.refresh(record)
    return _to_out(record)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incoming(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(IncomingRecord).filter(IncomingRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Incoming record not found")
    _ensure_access(current_user, record.packhouse_id)

    db.delete(record)
    db.commit()
    return None


def _ensure_access(current_user: User, packhouse_id: int) -> None:
    if current_user.role != "admin" and current_user.packhouse_id != packhouse_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
