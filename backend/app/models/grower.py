from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Grower(Base):
    __tablename__ = "growers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)  # e.g. "G001"
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=True)
    city = Column(String(120), nullable=True)
    mobile = Column(String(20), nullable=True)
    account = Column(String(200), nullable=True)  # payee/account display string

    packhouse_id = Column(Integer, ForeignKey("packhouses.id"), nullable=False)
    packhouse = relationship("Packhouse", back_populates="growers")

    incoming_records = relationship("IncomingRecord", back_populates="grower")
    payment_requests = relationship("PaymentRequest", back_populates="grower")
