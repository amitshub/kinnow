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


def bank_account_number(value: str | None) -> str | None:
    """Optional bank account number: digits only, 9 to 18 of them."""
    if value is None:
        return None
    value = value.strip()
    if value == "":
        return None
    if not re.fullmatch(r"\d{9,18}", value):
        raise ValueError("Account number must be 9 to 18 digits")
    return value


def ifsc_code(value: str | None) -> str | None:
    """Optional IFSC code, e.g. SBIN0001234 (4 letters, a zero, 6 letters/digits). Stored in capitals."""
    if value is None:
        return None
    value = value.strip().upper()
    if value == "":
        return None
    if not re.fullmatch(r"[A-Z]{4}0[A-Z0-9]{6}", value):
        raise ValueError("IFSC code must be 11 characters, e.g. SBIN0001234")
    return value
