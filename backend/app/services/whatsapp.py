import json
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import joinedload

from app.db.session import SessionLocal
from app.models.company_settings import CompanySettings
from app.models.message_content import MessageContent
from app.models.order import Order
from app.models.user import User, UserRole

logger = logging.getLogger("whatsapp")

# India Standard Time, as a fixed offset (no tzdata dependency needed).
IST = timezone(timedelta(hours=5, minutes=30))

# message_content row holding the approved "Order has been dispatched" template.
DISPATCH_CONTENT_ID = 2


def _total_crates(order: Order) -> int:
    return sum(item.qty for item in order.items)


def _load_order(db, order_id: int):
    return (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.packhouse), joinedload(Order.customer))
        .filter(Order.id == order_id)
        .first()
    )


def send_order_assigned_notification(order_id: int) -> None:
    """
    Fire-and-forget: notifies the packhouse's staff user via WhatsApp that a
    new order has been booked/assigned. Runs as a FastAPI background task,
    which executes after the request's own DB session may already be closed —
    so this opens its own session rather than reusing one. Any failure here
    is logged but must never affect the order-creation response, so every
    step is wrapped defensively.
    """
    db = SessionLocal()
    try:
        order = _load_order(db, order_id)
        if not order:
            logger.warning("WhatsApp notify: order %s not found", order_id)
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

        items_text = "; ".join(
            f"{i.brand} {i.variety} – {i.quality} – {i.qty} crates" for i in order.items
        )
        # Customer name + location, e.g. "Kishan Sharma, Bengluru" — keeps the
        # existing 4-variable template valid (no re-approval needed).
        customer_label = order.customer.name
        if order.customer.city:
            customer_label = f"{customer_label}, {order.customer.city}"

        content_variables = json.dumps(
            {
                "1": order.packhouse.name,
                "2": customer_label,
                "3": items_text,
                "4": f"{_total_crates(order)} crates",
            }
        )

        from twilio.rest import Client  # imported lazily so the package is only required when sending

        client = Client(company.twilio_sid, company.twilio_token)

        # ---- Recipient: packhouse staff ----
        staff = (
            db.query(User)
            .filter(User.packhouse_id == order.packhouse_id, User.role == UserRole.staff, User.is_active.is_(True))
            .order_by(User.id)
            .first()
        )
        if staff and staff.mobile:
            try:
                client.messages.create(
                    from_=f"whatsapp:{content.sender.sender_number}",
                    to=f"whatsapp:+91{staff.mobile}",
                    content_sid=content.content_sid,
                    content_variables=content_variables,
                )
                logger.info("WhatsApp notify: sent order %s alert to packhouse staff %s", order.code, staff.mobile)
            except Exception:
                logger.exception("WhatsApp notify: failed to send to packhouse staff for order %s", order_id)
        else:
            logger.warning("WhatsApp notify: no active staff with a mobile number for packhouse %s", order.packhouse_id)

        # ---- Recipient: customer ----
        # DISABLED for now (not needed at the moment). To turn it back on,
        # uncomment this block — it sends the same template to the customer.
        #
        # if order.customer.mobile:
        #     try:
        #         client.messages.create(
        #             from_=f"whatsapp:{content.sender.sender_number}",
        #             to=f"whatsapp:+91{order.customer.mobile}",
        #             content_sid=content.content_sid,
        #             content_variables=content_variables,
        #         )
        #         logger.info("WhatsApp notify: sent order %s alert to customer %s", order.code, order.customer.mobile)
        #     except Exception:
        #         logger.exception("WhatsApp notify: failed to send to customer for order %s", order_id)
        # else:
        #     logger.warning("WhatsApp notify: no mobile number on file for customer on order %s", order_id)

    except Exception:  # noqa: BLE001 — never let a notification failure break order creation
        logger.exception("WhatsApp notify: failed to send for order %s", order_id)
    finally:
        db.close()


def send_order_dispatched_notification(order_id: int) -> None:
    """
    Fire-and-forget: tells the admin(s) via WhatsApp that a packhouse has
    entered dispatch details for an order. Uses the approved template stored
    in message_content (id = DISPATCH_CONTENT_ID) with variables:
      {{1}} date, {{2}} customer name, {{3}} location,
      {{4}} truck number, {{5}} driver mobile
    """
    db = SessionLocal()
    try:
        order = _load_order(db, order_id)
        if not order:
            logger.warning("WhatsApp dispatch notify: order %s not found", order_id)
            return

        company = db.query(CompanySettings).first()
        if not company or not company.twilio_sid or not company.twilio_token:
            logger.warning("WhatsApp dispatch notify: Twilio credentials not configured in company_settings")
            return

        content = (
            db.query(MessageContent)
            .options(joinedload(MessageContent.sender))
            .filter(MessageContent.id == DISPATCH_CONTENT_ID, MessageContent.is_active.is_(True))
            .first()
        )
        if not content or not content.content_sid or not content.sender:
            logger.warning(
                "WhatsApp dispatch notify: message_content id=%s missing, inactive, or without a content_sid/sender",
                DISPATCH_CONTENT_ID,
            )
            return

        admins = (
            db.query(User)
            .filter(User.role == UserRole.admin, User.is_active.is_(True))
            .order_by(User.id)
            .all()
        )
        admins = [a for a in admins if a.mobile]
        if not admins:
            logger.warning("WhatsApp dispatch notify: no active admin with a mobile number")
            return

        # WhatsApp rejects empty template variables, so fall back to "-".
        content_variables = json.dumps(
            {
                "1": datetime.now(IST).strftime("%d-%m-%Y"),
                "2": order.customer.name or "-",
                "3": order.customer.city or "-",
                "4": order.truck or "-",
                "5": order.driver_mobile or "-",
            }
        )

        from twilio.rest import Client

        client = Client(company.twilio_sid, company.twilio_token)

        for admin in admins:
            try:
                client.messages.create(
                    from_=f"whatsapp:{content.sender.sender_number}",
                    to=f"whatsapp:+91{admin.mobile}",
                    content_sid=content.content_sid,
                    content_variables=content_variables,
                )
                logger.info("WhatsApp dispatch notify: sent order %s dispatch alert to admin %s", order.code, admin.mobile)
            except Exception:
                logger.exception("WhatsApp dispatch notify: failed to send to admin %s for order %s", admin.mobile, order_id)

    except Exception:  # noqa: BLE001 — never let a notification failure break the dispatch save
        logger.exception("WhatsApp dispatch notify: failed for order %s", order_id)
    finally:
        db.close()
