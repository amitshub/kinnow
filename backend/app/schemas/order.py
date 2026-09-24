from datetime import date, time

from pydantic import BaseModel, ConfigDict

from app.models.order import OrderStatus
from app.schemas.customer import CustomerOut


class OrderItemIn(BaseModel):
    brand: str
    variety: str
    quality: str
    qty: int


class OrderItemOut(OrderItemIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class OrderCreate(BaseModel):
    customer_id: int
    order_date: date
    remarks: str | None = None
    items: list[OrderItemIn]


class ChallanUpdate(BaseModel):
    truck: str | None = None
    driver: str | None = None
    transporter: str | None = None
    weight: float | None = None
    freight: float | None = None
    inam: float | None = None
    to_pay: float | None = None
    del_date: date | None = None
    del_time: time | None = None


class StatusUpdate(BaseModel):
    status: OrderStatus


class PackhouseBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    city: str | None = None


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    customer: CustomerOut
    packhouse: PackhouseBrief
    order_date: date
    status: OrderStatus
    remarks: str | None
    truck: str | None
    driver: str | None
    transporter: str | None
    weight: float | None
    freight: float | None
    inam: float | None
    to_pay: float | None
    del_date: date | None
    del_time: time | None
    bilty: str | None
    kaanta: str | None
    items: list[OrderItemOut]
