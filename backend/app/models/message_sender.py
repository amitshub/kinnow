from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship

from app.db.session import Base


class MessageSender(Base):
    __tablename__ = "message_sender"

    id = Column(Integer, primary_key=True, index=True)
    sender_name = Column(String(255), nullable=True)
    sender_number = Column(String(20), nullable=True)  # E.164, e.g. +919811301916
    is_active = Column(Boolean, nullable=False, default=True)

    contents = relationship("MessageContent", back_populates="sender")
