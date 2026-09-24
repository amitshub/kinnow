from pydantic import BaseModel, ConfigDict


class CustomerCreate(BaseModel):
    name: str
    mobile: str | None = None
    city: str | None = None
    gst_number: str | None = None


class CustomerUpdate(BaseModel):
    name: str
    mobile: str | None = None
    city: str | None = None
    gst_number: str | None = None


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    mobile: str | None = None
    city: str | None = None
    gst_number: str | None = None
