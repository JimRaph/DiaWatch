import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Request,
    Response,
    Cookie,
    Header,
    Body,
)
from fastapi.security import OAuth2PasswordRequestForm
import jwt
import bcrypt
from sqlalchemy.orm import Session

from database import get_db, User, PredictionStore, MonitorStore
from schema import (
    UserCreate,
    TokenPair,
    RefreshTokenRequest,
    UserResponse,
)

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-development-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7


router = APIRouter(prefix="/auth", tags=["Authentication"])


def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def get_password_hash(password):
    pwd_bytes = password.encode("utf-8")
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt(rounds=12)).decode("utf-8")


def create_tokens(user_id: int):
    now = datetime.now(timezone.utc)

    access_expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_data = {"sub": str(user_id), "type": "access", "exp": access_expire}
    access_token = jwt.encode(access_data, SECRET_KEY, algorithm=ALGORITHM)

    refresh_expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_data = {"sub": str(user_id), "type": "refresh", "exp": refresh_expire}
    refresh_token = jwt.encode(refresh_data, SECRET_KEY, algorithm=ALGORITHM)

    return access_token, refresh_token


async def get_current_user_optional(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        return db.query(User).filter(User.id == int(user_id)).first()
    except jwt.PyJWTError:
        return None


async def get_current_user_required(
    current_user: User = Depends(get_current_user_optional),
):
    """dependency for history page, user must be logged in"""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


@router.post("/register", response_model=UserResponse)
def register_user(
    user: UserCreate,
    response: Response,
    db: Session = Depends(get_db),
    guest_id: Optional[str] = Cookie(None, alias="guest_id"),
):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password)

    try:
        db.add(new_user)
        db.flush()

        if guest_id:
            if user.link_guest:
                print(
                    f"linking guest history {guest_id} to user {new_user.id} with {user.link_guest}"
                )

                db.query(PredictionStore).filter(
                    PredictionStore.guest_id == guest_id
                ).update(
                    {"user_id": new_user.id, "is_guest": False},
                    synchronize_session=False,
                )

                db.query(MonitorStore).filter(MonitorStore.guest_id == guest_id).update(
                    {"is_guest": False}, synchronize_session=False
                )

                print("guest history linked successfully")

            response.delete_cookie(key="guest_id", samesite="none", secure=True)

        db.commit()
        db.refresh(new_user)

        access_token, refresh_token = create_tokens(new_user.id)

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=7 * 24 * 60 * 60,
            path="/auth/refresh",
        )

        return {
            "id": new_user.id,
            "email": new_user.email,
            "access_token": access_token,
            "token_type": "bearer",
        }

    except Exception as e:
        db.rollback()
        print(f"error during registration/linking: {e}")
        raise HTTPException(
            status_code=500, detail="Registration failed due to an internal error"
        )

    # return new_user


@router.post("/login", response_model=TokenPair)
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token, refresh_token = create_tokens(user.id)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/auth/refresh",
    )

    response.delete_cookie(key="guest_id", samesite="none", secure=True)

    print("refresh_token: ", refresh_token)

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/refresh")
def refresh_access_token(
    response: Response,
    request: Request,
    refresh_token: Optional[str] = Cookie(None),
    refresh_token_body: Optional[RefreshTokenRequest] = Body(None),
    db: Session = Depends(get_db),
):

    #     print("All cookies:", request.cookies)
    #     print("cookie: ", Cookie)
    #     print("refresh_token: ", refresh_token)
    token = None

    if refresh_token_body and refresh_token_body.refresh_token:
        token = refresh_token_body.refresh_token
    elif refresh_token:
        token = refresh_token
    print("refresh_token: ", token)

    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if decoded.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        user_id = decoded.get("sub")
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

    except jwt.ExpiredSignatureError:
        response.delete_cookie("refresh_token")
        raise HTTPException(status_code=401, detail="Refresh token expired")

    access_expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    new_access_token = jwt.encode(
        {"sub": str(user.id), "type": "access", "exp": access_expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {"access_token": new_access_token, "token_type": "bearer"}


@router.post("/logout")
def logout(response: Response):
    """Clear refresh token cookie."""
    response.delete_cookie("refresh_token", path="/auth/refresh")
    response.delete_cookie(key="guest_id", samesite="none", secure=True)
    return {"message": "Logged out successfully"}
