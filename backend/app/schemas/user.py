from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.user import UserRole

class PackhouseBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    city: str | None = None

class UserCreate(BaseModel):
    name: str
    mobile: str
    password: str
    role: UserRole = UserRole.staff
    packhouse_id: int | None = None  # required for staff, ignored for admin
    email: EmailStr | None = None

class UserUpdate(BaseModel):
    name: str
    mobile: str
    role: UserRole
    packhouse_id: int | None = None
    password: str | None = None  # omit to keep the current password

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    mobile: str
    email: EmailStr | None = None
    role: UserRole
    is_active: bool
    packhouse: PackhouseBrief | None = None