"""
JWT creation, verification, and FastAPI dependency injection.
Uses httpOnly cookies (primary) with Bearer token fallback for API clients.
"""
from __future__ import annotations
import os
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Cookie, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv

from config.database import get_db

load_dotenv()

SECRET_KEY: str = os.getenv("SECRET_KEY", "")
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
COOKIE_NAME = "talentverse_token"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")

if not SECRET_KEY or SECRET_KEY == "CHANGE_ME_IN_PRODUCTION":
    raise RuntimeError("SECRET_KEY must be set to a strong random value")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Bearer fallback for non-browser API clients
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ── Password helpers ──────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── Token helpers ─────────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode["exp"] = expire
    to_encode.setdefault("jti", uuid.uuid4().hex)
    to_encode.setdefault("ver", 0)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def make_cookie_kwargs() -> dict:
    """Return kwargs for set_cookie calls, respecting environment config."""
    return {
        "key": COOKIE_NAME,
        "httponly": True,
        "secure": COOKIE_SECURE,
        "samesite": COOKIE_SAMESITE,
        "max_age": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "path": "/",
    }


def _extract_token(request: Request, bearer: str | None) -> str | None:
    """Extract JWT from httpOnly cookie first, then Bearer header fallback."""
    cookie_token = request.cookies.get(COOKIE_NAME)
    if cookie_token:
        return cookie_token
    return bearer


# ── Current user dependency ───────────────────────────────────────────────────
async def get_current_user(
    request: Request,
    bearer: str | None = Depends(oauth2_scheme),
    db=Depends(get_db),
):
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = _extract_token(request, bearer)
    if not token:
        raise credentials_exc

    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise credentials_exc
    except HTTPException:
        raise credentials_exc

    from bson import ObjectId

    if not ObjectId.is_valid(user_id):
        raise credentials_exc

    jti = payload.get("jti")
    if jti and await db.token_blocklist.find_one({"jti": jti}):
        raise credentials_exc

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise credentials_exc
    if int(payload.get("ver", 0)) != int(user.get("token_version", 0)):
        raise credentials_exc
    return user


async def get_current_recruiter(current_user=Depends(get_current_user)):
    account_roles = current_user.get("account_roles") or [current_user.get("role", "CREATIVE")]
    if current_user.get("role") != "RECRUITER" and "RECRUITER" not in account_roles:
        raise HTTPException(status_code=403, detail="Recruiters only")
    return current_user
