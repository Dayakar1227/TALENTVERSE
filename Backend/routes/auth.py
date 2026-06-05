"""
Auth routes: /api/auth/register, /api/auth/login, /api/auth/logout,
             /api/auth/me, /api/auth/change-password
"""
import os
import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordBearer

from config.database import get_db
from middleware.auth import (
    COOKIE_NAME,
    create_access_token,
    decode_access_token,
    get_current_user,
    hash_password,
    make_cookie_kwargs,
    verify_password,
    _extract_token,
)
from models.schemas import UserCreate, LoginRequest, Token, UserPublic, ChangePasswordRequest
from utils.helpers import serialize_user

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

REQUIRE_EMAIL_VERIFICATION = os.getenv("REQUIRE_EMAIL_VERIFICATION", "false").lower() == "true"
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("AUTH_RATE_LIMIT_WINDOW_SECONDS", "300"))
RATE_LIMIT_MAX_ATTEMPTS = int(os.getenv("AUTH_RATE_LIMIT_MAX_ATTEMPTS", "8"))
_auth_attempts: dict[str, list[float]] = {}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _check_rate_limit(key: str) -> None:
    now = time.time()
    attempts = [
        ts for ts in _auth_attempts.get(key, [])
        if now - ts < RATE_LIMIT_WINDOW_SECONDS
    ]
    if len(attempts) >= RATE_LIMIT_MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
    attempts.append(now)
    _auth_attempts[key] = attempts


def _clear_rate_limit(key: str) -> None:
    _auth_attempts.pop(key, None)


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, request: Request, response: Response, db=Depends(get_db)):
    rate_key = f"register:{request.client.host if request.client else 'unknown'}:{payload.email.lower()}"
    _check_rate_limit(rate_key)
    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    if payload.role.value == "ADMIN":
        raise HTTPException(status_code=400, detail="Invalid account role")

    doc = payload.model_dump()
    doc["hashed_password"] = hash_password(doc.pop("password"))
    requested_role = payload.role.value
    doc["role"] = "CREATIVE"
    doc["account_roles"] = ["CREATIVE", "RECRUITER"] if requested_role == "RECRUITER" else ["CREATIVE"]
    doc["roles"] = []
    doc["interested_roles"] = []
    doc["trust_score"] = 50.0
    doc["trust_score_level"] = "Newcomer"
    doc["is_verified"] = False
    doc["is_email_verified"] = False
    doc["token_version"] = 0
    doc["portfolio_count"] = 0
    doc["created_at"] = _now()
    doc["updated_at"] = _now()

    result = await db.users.insert_one(doc)
    user = await db.users.find_one({"_id": result.inserted_id})

    _clear_rate_limit(rate_key)
    token = create_access_token({"sub": str(result.inserted_id), "ver": 0})

    # Set httpOnly cookie
    response.set_cookie(value=token, **make_cookie_kwargs())

    return Token(access_token=token, user=serialize_user(user))


@router.post("/login", response_model=Token)
async def login(payload: LoginRequest, request: Request, response: Response, db=Depends(get_db)):
    rate_key = f"{request.client.host if request.client else 'unknown'}:{payload.email.lower()}"
    _check_rate_limit(rate_key)

    user = await db.users.find_one({"email": payload.email})
    # NOTE: local fallback auto-create removed — always requires prior registration
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if REQUIRE_EMAIL_VERIFICATION and not user.get("is_email_verified", False):
        raise HTTPException(status_code=403, detail="Email verification required")

    _clear_rate_limit(rate_key)
    token = create_access_token({"sub": str(user["_id"]), "ver": user.get("token_version", 0)})

    # Set httpOnly cookie
    response.set_cookie(value=token, **make_cookie_kwargs())

    return Token(access_token=token, user=serialize_user(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    bearer: str | None = Depends(oauth2_scheme),
    db=Depends(get_db),
):
    token = _extract_token(request, bearer)
    if token:
        try:
            payload = decode_access_token(token)
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti:
                await db.token_blocklist.update_one(
                    {"jti": jti},
                    {"$set": {"jti": jti, "expires_at": datetime.fromtimestamp(exp, timezone.utc) if exp else _now()}},
                    upsert=True,
                )
        except HTTPException:
            pass  # Already invalid token — still clear the cookie

    # Clear the httpOnly cookie
    response.delete_cookie(key=COOKIE_NAME, path="/")


@router.get("/me", response_model=UserPublic)
async def me(current_user=Depends(get_current_user)):
    return serialize_user(current_user)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    response: Response,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    if not verify_password(payload.current_password, current_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    new_hashed = hash_password(payload.new_password)
    # Bump token_version to invalidate all existing sessions
    new_version = int(current_user.get("token_version", 0)) + 1
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {
            "hashed_password": new_hashed,
            "token_version": new_version,
            "updated_at": _now(),
        }},
    )
    # Issue a fresh token with updated version
    new_token = create_access_token({"sub": str(current_user["_id"]), "ver": new_version})
    response.set_cookie(value=new_token, **make_cookie_kwargs())
