from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_admin
from app.models.brand import Brand
from app.models.quality import Quality
from app.models.user import User
from app.models.variety import Variety
from app.schemas.catalog import CatalogItemCreate, CatalogItemOut

router = APIRouter(tags=["catalog"])


def _build_routes(prefix: str, model) -> APIRouter:
    sub = APIRouter(prefix=prefix)

    @sub.get("", response_model=list[CatalogItemOut])
    def list_items(
        db: Session = Depends(get_db),
        _user: User = Depends(get_current_user),
    ):
        return db.query(model).filter(model.is_active.is_(True)).order_by(model.name).all()

    @sub.post("", response_model=CatalogItemOut, status_code=status.HTTP_201_CREATED)
    def create_item(
        payload: CatalogItemCreate,
        db: Session = Depends(get_db),
        _admin: User = Depends(require_admin),
    ):
        name = payload.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name cannot be empty")

        existing = db.query(model).filter(model.name == name).first()
        if existing:
            if existing.is_active:
                raise HTTPException(status_code=400, detail="This value already exists")
            existing.is_active = True
            db.commit()
            db.refresh(existing)
            return existing

        item = model(name=name, is_active=True)
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @sub.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
    def deactivate_item(
        item_id: int,
        db: Session = Depends(get_db),
        _admin: User = Depends(require_admin),
    ):
        item = db.query(model).filter(model.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Not found")
        item.is_active = False
        db.commit()
        return None

    return sub


router.include_router(_build_routes("/brands", Brand))
router.include_router(_build_routes("/varieties", Variety))
router.include_router(_build_routes("/qualities", Quality))
