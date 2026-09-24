import json
import logging

from sqlalchemy.orm import joinedload

from app.db.session import SessionLocal
from app.models.company_settings import CompanySettings
from app.models.message_content import MessageContent
from app.models.order import Order
from app.models.user import User, UserRole

logger = logging.getLogger("whatsapp")


def _total_crates(order: Order) -> int:
    return sum(item.qty for item in order.items)


def send_order_assigned_notification(order_id: int) -> None:
    """
    Fire-and-forget: notifies the packhouse's staff user via WhatsApp that a
    new order has been assigned to them. Runs as a FastAPI background task,
    which executes after the request's own DB session may already be closed —
    so this opens its own session rather than reusing one. Any failure here
    is logged but must never affect the order-creation response, so every
    step is wrapped defensively.
    """
    db = SessionLocal()
    try:
        order = (
            db.query(Order)
            .options(joinedload(Order.items), joinedload(Order.packhouse), joinedload(Order.customer))
            .filter(Order.id == order_id)
            .first()
        )
        if not order:
            logger.warning("WhatsApp notify: order %s not found", order_id)
            return

        staff = (
            db.query(User)
            .filter(User.packhouse_id == order.packhouse_id, User.role == UserRole.staff, User.is_active.is_(True))
            .order_by(User.id)
            .first()
        )
        if not staff or not staff.mobile:
            logger.warning("WhatsApp notify: no active staff with a mobile number for packhouse %s", order.packhouse_id)
            return

        company = db.query(CompanySettings).first()
        if not company or not company.twilio_sid or not company.twilio_token:
            logger.warning("WhatsApp notify: Twilio credentials not configured in company_settings")
            return

        content = (
            db.query(MessageContent)
            .options(joinedload(MessageContent.sender))
            .filter(MessageContent.content_name == "order_packhouse", MessageContent.is_active.is_(True))
            .first()
        )
        if not content or not content.content_sid or not content.sender:
            logger.warning("WhatsApp notify: no active 'order_packhouse' message_content configured")
            return

        # WhatsApp template variables cannot contain newlines (Meta/Twilio will
        # reject the whole send with error 21656 "ContentVariables Parameter
        # is invalid") — so items are joined on one line instead of one-per-line.
        items_text = "; ".join(
            f"{i.brand} {i.variety} – {i.quality} – {i.qty} crates" for i in order.items
        )
        content_variables = json.dumps(
            {
                "1": order.packhouse.name,
                "2": order.customer.name,
                "3": items_text,
                "4": f"{_total_crates(order)} crates",
            }
        )

        from twilio.rest import Client  # imported lazily so the package is only required when sending

        client = Client(company.twilio_sid, company.twilio_token)
        client.messages.create(
            from_=f"whatsapp:{content.sender.sender_number}",
            to=f"whatsapp:+91{staff.mobile}",
            content_sid=content.content_sid,
            content_variables=content_variables,
        )
        logger.info("WhatsApp notify: sent order %s alert to %s", order.code, staff.mobile)

    except Exception:  # noqa: BLE001 — never let a notification failure break order creation
        logger.exception("WhatsApp notify: failed to send for order %s", order_id)
    finally:
        db.close()
