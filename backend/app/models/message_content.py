from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class MessageContent(Base):
    __tablename__ = "message_content"

    id = Column(Integer, primary_key=True, index=True)
    content_name = Column(String(255), nullable=False)  # e.g. "order_packhouse"
    content_sid = Column(Text, nullable=True)  # Twilio approved template SID, e.g. HX...
    sender_id = Column(Integer, ForeignKey("message_sender.id"), nullable=False)
    message_template = Column(Text, nullable=True)  # kept for reference/preview only
    is_active = Column(Boolean, nullable=False, default=True)

    sender = relationship("MessageSender", back_populates="contents")
