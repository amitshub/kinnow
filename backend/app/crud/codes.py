"""
Generates human-friendly sequential codes (G001, IN0001, PAY0001, ...)
the same way the original prototype displayed IDs, but deterministically
based on row count rather than randomly.
"""

from sqlalchemy import func
from sqlalchemy.orm import Session


def next_code(db: Session, model, prefix: str, width: int) -> str:
    count = db.query(func.count(model.id)).scalar() or 0
    return f"{prefix}{str(count + 1).zfill(width)}"
