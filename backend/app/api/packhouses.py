from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.packhouse import Packhouse
from app.models.user import User
from app.schemas.user import PackhouseBrief

router = APIRouter(prefix="/packhouses", tags=["packhouses"])


@router.get("", response_model=list[PackhouseBrief])
def list_packhouses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Admins see every packhouse (e.g. to filter reports).
    Staff just get their own single packhouse back.
    """
    if current_user.role == "admin":
        return db.query(Packhouse).order_by(Packhouse.name).all()
    if current_user.packhouse:
        return [current_user.packhouse]
    return []
