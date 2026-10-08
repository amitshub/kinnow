from datetime import date, datetime, timedelta, timezone

# India Standard Time as a fixed offset (no tzdata dependency needed).
IST = timezone(timedelta(hours=5, minutes=30))


def today_ist() -> date:
    return datetime.now(IST).date()
