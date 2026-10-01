from pydantic import BaseModel, ConfigDict


class CatalogItemCreate(BaseModel):
    name: str


class CatalogItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
