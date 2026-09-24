from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False)
    mobile = Column(String(15), nullable=True)
    city = Column(String(120), nullable=True)
    gst_number = Column(String(20), nullable=True)  # filled in later, e.g. at dispatch time

    orders = relationship("Order", back_populates="customer")
