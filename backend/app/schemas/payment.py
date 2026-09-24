from datetime import date

from pydantic import BaseModel, ConfigDict

from app.models.payment import PaymentStatus


class PaymentCreate(BaseModel):
    grower_id: int
    amount: float
    request_date: date
    note: str | None = None


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    grower_id: int
    grower_name: str
    account: str | None = None
    packhouse_id: int
    amount: float
    request_date: date
    status: PaymentStatus
    note: str | None = None
