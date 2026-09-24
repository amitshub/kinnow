from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, resolve_packhouse_id
from app.crud.codes import next_code
from app.models.grower import Grower
from app.models.user import User
from app.schemas.grower import GrowerCreate, GrowerOut, GrowerUpdate

router = APIRouter(prefix="/growers", tags=["growers"])


@router.get("", response_model=list[GrowerOut])
def list_growers(
    packhouse_id: int | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ph_id = resolve_packhouse_id(current_user, packhouse_id)
    q = db.query(Grower).filter(Grower.packhouse_id == ph_id)
    if search:
        like = f"%{search}%"
        q = q.filter(Grower.name.ilike(like) | Grower.city.ilike(like))
    return q.order_by(Grower.name).all()


@router.post("", response_model=GrowerOut, status_code=status.HTTP_201_CREATED)
def create_grower(
    payload: GrowerCreate,
    packhouse_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ph_id = resolve_packhouse_id(current_user, packhouse_id)
    grower = Grower(
        code=next_code(db, Grower, "G", 3),
        packhouse_id=ph_id,
        **payload.model_dump(),
    )
    db.add(grower)
    db.commit()
    db.refresh(grower)
    return grower


@router.put("/{grower_id}", response_model=GrowerOut)
def update_grower(
    grower_id: int,
    payload: GrowerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    grower = db.query(Grower).filter(Grower.id == grower_id).first()
    if not grower:
        raise HTTPException(status_code=404, detail="Grower not found")
    _ensure_access(current_user, grower.packhouse_id)

    for field, value in payload.model_dump().items():
        setattr(grower, field, value)
    db.commit()
    db.refresh(grower)
    return grower


@router.delete("/{grower_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grower(
    grower_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    grower = db.query(Grower).filter(Grower.id == grower_id).first()
    if not grower:
        raise HTTPException(status_code=404, detail="Grower not found")
    _ensure_access(current_user, grower.packhouse_id)

    db.delete(grower)
    db.commit()
    return None


def _ensure_access(current_user: User, packhouse_id: int) -> None:
    if current_user.role != "admin" and current_user.packhouse_id != packhouse_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
