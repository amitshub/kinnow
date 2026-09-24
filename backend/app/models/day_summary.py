from sqlalchemy import Column, Integer, Float, ForeignKey, Date, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.session import Base


class DaySummary(Base):
    """Grading + dispatch summary for one packhouse on one date.

    One row per (packhouse_id, summary_date).
    """

    __tablename__ = "day_summaries"
    __table_args__ = (
        UniqueConstraint("packhouse_id", "summary_date", name="uq_packhouse_date"),
    )

    id = Column(Integer, primary_key=True, index=True)

    packhouse_id = Column(Integer, ForeignKey("packhouses.id"), nullable=False)
    packhouse = relationship("Packhouse", back_populates="day_summaries")

    summary_date = Column(Date, nullable=False, index=True)

    incoming_total = Column(Float, nullable=False, default=0)   # total kg received that day
    eagle_a = Column(Float, nullable=False, default=0)          # Eagle/Grade A kg
    grade_b = Column(Float, nullable=False, default=0)          # derived: incoming_total - eagle_a
    dispatched = Column(Float, nullable=False, default=0)       # kg dispatched via challans
    prev_balance = Column(Float, nullable=False, default=0)     # carried from previous day
    balance = Column(Float, nullable=False, default=0)          # prev_balance + incoming_total - dispatched
