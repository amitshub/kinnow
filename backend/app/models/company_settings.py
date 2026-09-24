from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.db.session import Base


class CompanySettings(Base):
    __tablename__ = "company_settings"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(160), nullable=False)
    company_email = Column(String(120), nullable=True)
    phone = Column(String(15), nullable=True)
    company_address = Column(String(255), nullable=True)
    company_address1 = Column(Text, nullable=True)
    company_address2 = Column(Text, nullable=True)
    gstin = Column(String(20), nullable=True)

    # Twilio credentials for WhatsApp sending
    twilio_sid = Column(String(64), nullable=True)
    twilio_token = Column(String(64), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
