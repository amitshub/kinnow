import enum

from sqlalchemy import Column, Integer, String, Float, Date, Time, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class OrderStatus(str, enum.Enum):
    pending = "Pending"
    confirmed = "Confirmed"
    dispatched = "Dispatched"
    cancelled = "Cancelled"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)  # ORD-0001

    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)

    packhouse_id = Column(Integer, ForeignKey("packhouses.id"), nullable=False)
    order_date = Column(Date, nullable=False)
    status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.pending)
    remarks = Column(String(255), nullable=True)

    # Dispatch / challan details — filled in once the order ships.
    truck = Column(String(40), nullable=True)
    driver = Column(String(120), nullable=True)
    transporter = Column(String(120), nullable=True)
    weight = Column(Float, nullable=True)
    freight = Column(Float, nullable=True)
    inam = Column(Float, nullable=True)
    to_pay = Column(Float, nullable=True)
    del_date = Column(Date, nullable=True)
    del_time = Column(Time, nullable=True)

    # Document references (upload flow not built — plain text/URL placeholders).
    bilty = Column(Text, nullable=True)
    kaanta = Column(Text, nullable=True)

    customer = relationship("Customer", back_populates="orders")
    packhouse = relationship("Packhouse")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    brand = Column(String(60), nullable=False)
    variety = Column(String(60), nullable=False)
    quality = Column(String(60), nullable=False)
    qty = Column(Integer, nullable=False)

    order = relationship("Order", back_populates="items")
