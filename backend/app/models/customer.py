from sqlalchemy import Boolean, Column, Integer, String, Text, false
from sqlalchemy.orm import deferred, relationship
from app.db.session import Base


class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False)
    mobile = Column(String(15), nullable=True)
    city = Column(String(120), nullable=True)
    address = Column(String(255), nullable=True)
    # Photo of the customer's business card, stored as a data URI. `deferred` keeps it out of normal queries
    # (customer lists and orders) so they stay small; it is only read by the card endpoint.
    card_image = deferred(Column(Text, nullable=True))
    has_card = Column(Boolean, nullable=False, default=False, server_default=false())
    gst_number = Column(String(20), nullable=True)
    orders = relationship("Order", back_populates="customer")
