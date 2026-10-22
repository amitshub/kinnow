from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.validators import ten_digit_mobile


class CustomerCreate(BaseModel):
    name: str
    mobile: str | None = None
    city: str | None = None
    address: str | None = None
    gst_number: str | None = None

    @field_validator("mobile")
    @classmethod
    def _check_mobile(cls, v):
        return ten_digit_mobile(v)


class CustomerUpdate(BaseModel):
    name: str
    mobile: str | None = None
    city: str | None = None
    address: str | None = None
    gst_number: str | None = None

    @field_validator("mobile")
    @classmethod
    def _check_mobile(cls, v):
        return ten_digit_mobile(v)


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    mobile: str | None = None
    city: str | None = None
    address: str | None = None
    gst_number: str | None = None
