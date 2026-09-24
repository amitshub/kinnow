from pydantic import BaseModel, ConfigDict


class GrowerBase(BaseModel):
    name: str
    address: str | None = None
    city: str | None = None
    mobile: str | None = None
    account: str | None = None


class GrowerCreate(GrowerBase):
    pass


class GrowerUpdate(GrowerBase):
    pass


class GrowerOut(GrowerBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    packhouse_id: int
