from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User
from auth.jwt_utils import decode_access_token

# This tells Swagger where to get the token from
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate JWT. Returns User ORM object."""
    payload = decode_access_token(token)

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


def require_writer(current_user: User = Depends(get_current_user)) -> User:
    """Only allow writers. Raises 403 otherwise."""
    if current_user.role != "writer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Write access required",
        )
    return current_user