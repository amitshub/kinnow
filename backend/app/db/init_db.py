"""
Run this once to create tables and seed initial data:

    cd backend
    python -m app.db.init_db

Creates:
  - 3 packhouses (matching the original prototype's PACKHOUSE_LIST)
  - 1 admin login    -> mobile 9999900001 / password admin123
  - 1 staff login per packhouse -> mobile 9999900002 / password staff123 (PH-1), etc.
  - A handful of sample growers for PH-1
  - Two demo orders for the Admin Orders screen

Change the default passwords immediately in any real deployment.
"""

from datetime import date, timedelta

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import Base, SessionLocal, engine
from app.models.company_settings import CompanySettings
from app.models.customer import Customer
from app.models.grower import Grower
from app.models.message_content import MessageContent
from app.models.message_sender import MessageSender
from app.models.order import Order, OrderItem, OrderStatus
from app.models.packhouse import Packhouse
from app.models.user import User, UserRole

PACKHOUSES = [
    ("PH-1 Abohar", "Abohar"),
    ("PH-2 Hanumangarh", "Hanumangarh"),
    ("PH-3 Sri Ganganagar", "Sri Ganganagar"),
]

SAMPLE_GROWERS = [
    ("G001", "Ram Singh", "Village Mehna, Abohar", "Abohar", "9876500001", "Ram Singh - PNB 4521"),
    ("G002", "Baldev Kaur Farms", "Near Mandi, Fazilka Road", "Fazilka", "9876500002", "Baldev Kaur - SBI 7832"),
    ("G003", "Sukhwinder Orchards", "Kotkapura Road", "Faridkot", "9876500003", "Sukhwinder Singh - BOI 2210"),
    ("G004", "Harjit Singh & Sons", "Abohar District", "Abohar", "9876500004", "Harjit Singh - HDFC 9901"),
    ("G005", "Parveen Fruit Farm", "Rampura, Hanumangarh", "Hanumangarh", "9876500005", "Parveen Kumar - Axis 3340"),
]


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Packhouse).count() > 0:
            print("Database already seeded — skipping.")
            return

        packhouses = []
        for name, city in PACKHOUSES:
            ph = Packhouse(name=name, city=city)
            db.add(ph)
            packhouses.append(ph)
        db.flush()  # get IDs

        admin = User(
            name="Admin",
            mobile="9999900001",
            hashed_password=hash_password("admin123"),
            role=UserRole.admin,
            packhouse_id=None,
        )
        db.add(admin)

        for idx, ph in enumerate(packhouses, start=1):
            staff = User(
                name=f"{ph.name} Staff",
                mobile=f"999990000{idx + 1}",
                hashed_password=hash_password("staff123"),
                role=UserRole.staff,
                packhouse_id=ph.id,
            )
            db.add(staff)

        # Sample growers only for the first packhouse, like the original prototype
        for code, name, address, city, mobile, account in SAMPLE_GROWERS:
            db.add(
                Grower(
                    code=code,
                    name=name,
                    address=address,
                    city=city,
                    mobile=mobile,
                    account=account,
                    packhouse_id=packhouses[0].id,
                )
            )

        # A couple of demo customers + orders so the Admin screens aren't empty on first login
        cust1 = Customer(name="Lokenath Fal Bhander", mobile="9876543210", city="Agartala")
        cust2 = Customer(name="Sharma Fruits Depot", mobile="9812345678", city="Delhi")
        db.add(cust1)
        db.add(cust2)
        db.flush()

        order1 = Order(
            code="ORD-0001",
            customer_id=cust1.id,
            packhouse_id=packhouses[0].id,
            order_date=date.today() - timedelta(days=1),
            status=OrderStatus.dispatched,
            remarks="SPL KINNOWS",
            truck="JK11G 6411",
            driver="Ahmad",
            transporter="APR",
            weight=23300,
            freight=248000,
            inam=4100,
            to_pay=178000,
            del_date=date.today(),
        )
        db.add(order1)
        db.flush()
        db.add(OrderItem(order_id=order1.id, brand="Eagle", variety="60 PCS", quality="HD Green", qty=50))
        db.add(OrderItem(order_id=order1.id, brand="KGR", variety="72 PCS", quality="HD Green", qty=133))

        order2 = Order(
            code="ORD-0002",
            customer_id=cust2.id,
            packhouse_id=packhouses[1].id,
            order_date=date.today(),
            status=OrderStatus.confirmed,
            remarks="",
        )
        db.add(order2)
        db.flush()
        db.add(OrderItem(order_id=order2.id, brand="Star", variety="84 PCS", quality="Export", qty=80))

        # Company settings + Twilio WhatsApp config
        db.add(
            CompanySettings(
                company_name="Shiv Bhola Group",
                company_email="shivbholagroup@yahoo.com",
                phone="9811128770",
                company_address="C – 25 & C – 691 New Subzi Mandi,",
                company_address1="Azadpur",
                company_address2="Delhi - 110033",
                gstin="09HTZPK4680M1ZD",
                twilio_sid=settings.TWILIO_SID,
                twilio_token=settings.TWILIO_TOKEN,
            )
        )

        sender = MessageSender(sender_name="Shiv Bhola Fruit", sender_number="+919811301916", is_active=True)
        db.add(sender)
        db.flush()

        db.add(
            MessageContent(
                content_name="order_packhouse",
                content_sid="HX0192e873a354ba63b228195f0ba17083",
                sender_id=sender.id,
                message_template=(
                    "*New Order Alert – {{1}}*\n\n"
                    "Customer: {{2}}\n"
                    "Items:\n{{3}}\n\n"
                    "Total: {{4}}\n\n"
                    "Please process accordingly.\nShivBhola Group"
                ),
                is_active=True,
            )
        )

        db.commit()
        print("Seed complete.")
        print("  Admin login:  9999900001 / admin123")
        for idx, ph in enumerate(packhouses, start=1):
            print(f"  {ph.name} staff login: 999990000{idx + 1} / staff123")
    finally:
        db.close()


if __name__ == "__main__":
    run()
