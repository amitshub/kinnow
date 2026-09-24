from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, resolve_packhouse_id
from app.models.day_summary import DaySummary
from app.models.incoming import IncomingRecord
from app.models.user import User
from app.schemas.day_summary import DaySummaryOut, DaySummaryUpsert

router = APIRouter(prefix="/day-summary", tags=["day-summary"])


@router.get("", response_model=list[DaySummaryOut])
def list_day_summaries(
    packhouse_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ph_id = resolve_packhouse_id(current_user, packhouse_id)
    return (
        db.query(DaySummary)
        .filter(DaySummary.packhouse_id == ph_id)
        .order_by(DaySummary.summary_date.desc())
        .all()
    )


@router.get("/{summary_date}", response_model=DaySummaryOut | None)
def get_day_summary(
    summary_date: date,
    packhouse_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ph_id = resolve_packhouse_id(current_user, packhouse_id)
    return (
        db.query(DaySummary)
        .filter(DaySummary.packhouse_id == ph_id, DaySummary.summary_date == summary_date)
        .first()
    )


@router.put("", response_model=DaySummaryOut)
def upsert_day_summary(
    payload: DaySummaryUpsert,
    packhouse_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mirrors the prototype's "Day Summary & Grading" modal:
      - incoming_total = sum of weight for that packhouse/date's incoming records
      - grade_b        = incoming_total - eagle_a (never below 0)
      - prev_balance   = balance from the most recent earlier day_summary row
      - balance        = prev_balance + incoming_total - dispatched
    """
    ph_id = resolve_packhouse_id(current_user, packhouse_id)

    incoming_total = (
        db.query(IncomingRecord)
        .filter(
            IncomingRecord.packhouse_id == ph_id,
            IncomingRecord.record_date == payload.summary_date,
        )
        .with_entities(IncomingRecord.weight)
        .all()
    )
    total_weight = sum(w for (w,) in incoming_total)

    prev_row = (
        db.query(DaySummary)
        .filter(
            DaySummary.packhouse_id == ph_id,
            DaySummary.summary_date < payload.summary_date,
        )
        .order_by(DaySummary.summary_date.desc())
        .first()
    )
    prev_balance = prev_row.balance if prev_row else 0

    grade_b = max(0.0, total_weight - payload.eagle_a)
    balance = prev_balance + total_weight - payload.dispatched

    row = (
        db.query(DaySummary)
        .filter(
            DaySummary.packhouse_id == ph_id,
            DaySummary.summary_date == payload.summary_date,
        )
        .first()
    )
    if row is None:
        row = DaySummary(packhouse_id=ph_id, summary_date=payload.summary_date)
        db.add(row)

    row.incoming_total = total_weight
    row.eagle_a = payload.eagle_a
    row.grade_b = grade_b
    row.dispatched = payload.dispatched
    row.prev_balance = prev_balance
    row.balance = balance

    db.commit()
    db.refresh(row)
    return row
