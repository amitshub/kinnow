import enum

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.db.session import Base


class UserRole(str, enum.Enum):
    admin = "admin"       # sees / approves across all packhouses
    staff = "staff"       # scoped to their own packhouse


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    mobile = Column(String(15), unique=True, index=True, nullable=False)
    email = Column(String(190), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.staff)
    is_active = Column(Boolean, default=True, nullable=False)

    # Admins may have no packhouse (packhouse_id = NULL) since they see all.
    packhouse_id = Column(Integer, ForeignKey("packhouses.id"), nullable=True)
    packhouse = relationship("Packhouse", back_populates="users")
