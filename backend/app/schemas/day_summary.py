from datetime import date

from pydantic import BaseModel, ConfigDict


class DaySummaryUpsert(BaseModel):
    summary_date: date
    eagle_a: float
    dispatched: float


class DaySummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    packhouse_id: int
    summary_date: date
    incoming_total: float
    eagle_a: float
    grade_b: float
    dispatched: float
    prev_balance: float
    balance: float
