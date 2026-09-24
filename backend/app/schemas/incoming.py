from datetime import date, time

from pydantic import BaseModel, ConfigDict


class IncomingCreate(BaseModel):
    grower_id: int
    weight: float
    price: float
    amount: float | None = None  # if omitted, computed as weight * price
    record_date: date
    record_time: time | None = None


class IncomingUpdate(IncomingCreate):
    pass


class IncomingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    grower_id: int
    grower_name: str
    grower_city: str | None = None
    packhouse_id: int
    weight: float
    price: float
    amount: float
    record_date: date
    record_time: time | None = None
