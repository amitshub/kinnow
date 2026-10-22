import re


def ten_digit_mobile(value: str | None) -> str | None:
    """Optional mobile number: blank becomes None, anything else must be exactly 10 digits."""
    if value is None:
        return None
    value = value.strip()
    if value == "":
        return None
    if not re.fullmatch(r"\d{10}", value):
        raise ValueError("Mobile number must be exactly 10 digits")
    return value
