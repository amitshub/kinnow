from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Time
from sqlalchemy.orm import relationship

from app.db.session import Base


class IncomingRecord(Base):
    """A single grower delivery recorded on a given date at a packhouse."""

    __tablename__ = "incoming_records"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)  # e.g. "IN0001"

    grower_id = Column(Integer, ForeignKey("growers.id"), nullable=False)
    grower = relationship("Grower", back_populates="incoming_records")

    packhouse_id = Column(Integer, ForeignKey("packhouses.id"), nullable=False)
    packhouse = relationship("Packhouse", back_populates="incoming_records")

    weight = Column(Float, nullable=False)       # kg
    price = Column(Float, nullable=False)        # ₹ / kg
    amount = Column(Float, nullable=False)        # weight * price (or overridden)

    record_date = Column(Date, nullable=False, index=True)
    record_time = Column(Time, nullable=True)
