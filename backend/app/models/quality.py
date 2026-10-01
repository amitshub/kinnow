from sqlalchemy import Column, Integer, String, Boolean

from app.db.session import Base


class Quality(Base):
    __tablename__ = "qualities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(60), nullable=False, unique=True)
    is_active = Column(Boolean, nullable=False, default=True)
