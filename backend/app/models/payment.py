import enum

from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Enum
from sqlalchemy.orm import relationship

from app.db.session import Base


class PaymentStatus(str, enum.Enum):
    pending = "Pending"
    approved = "Approved"
    rejected = "Rejected"


class PaymentRequest(Base):
    __tablename__ = "payment_requests"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)  # e.g. "PAY0001"

    grower_id = Column(Integer, ForeignKey("growers.id"), nullable=False)
    grower = relationship("Grower", back_populates="payment_requests")

    packhouse_id = Column(Integer, ForeignKey("packhouses.id"), nullable=False)
    packhouse = relationship("Packhouse", back_populates="payment_requests")

    account = Column(String(200), nullable=True)  # snapshot of grower's account at request time
    amount = Column(Float, nullable=False)
    request_date = Column(Date, nullable=False)
    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.pending)
    note = Column(String(500), nullable=True)
