from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class Packhouse(Base):
    __tablename__ = "packhouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False)  # e.g. "PH-1 Abohar"
    city = Column(String(120), nullable=True)

    users = relationship("User", back_populates="packhouse")
    growers = relationship("Grower", back_populates="packhouse")
    incoming_records = relationship("IncomingRecord", back_populates="packhouse")
    day_summaries = relationship("DaySummary", back_populates="packhouse")
    payment_requests = relationship("PaymentRequest", back_populates="packhouse")
