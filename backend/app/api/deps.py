from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def resolve_packhouse_id(current_user: User, requested_packhouse_id: int | None = None) -> int:
    """
    Staff are always scoped to their own packhouse.
    Admins may pass `requested_packhouse_id` to view a specific packhouse;
    if omitted, callers should handle the "all packhouses" case separately.
    """
    if current_user.role == UserRole.staff:
        if current_user.packhouse_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This user is not assigned to a packhouse",
            )
        return current_user.packhouse_id

    if requested_packhouse_id is not None:
        return requested_packhouse_id

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="packhouse_id is required for admin requests",
    )
