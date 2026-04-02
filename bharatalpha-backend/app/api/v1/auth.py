from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.router import error_response, success_response
from app.config import settings
from app.database import get_db_session
from app.models.db.user import User
from app.models.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    UserOut,
)
from app.security import TokenError, create_access_token, create_refresh_token, decode_token, hash_password, verify_password


router = APIRouter(prefix="/auth", tags=["auth"])


def _tokens_for_user(user: User) -> TokenPair:
    access = create_access_token(subject=str(user.id))
    refresh = create_refresh_token(subject=str(user.id))
    return TokenPair(
        access_token=access,
        refresh_token=refresh,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )


@router.post("/register", response_model=None)
async def register(
    payload: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session),
):
    existing = await db.scalar(select(User).where(User.email == str(payload.email)))
    if existing is not None:
        return error_response("EMAIL_ALREADY_EXISTS", "Email already registered", status_code=409)

    user = User(
        email=str(payload.email),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    data = AuthResponse(
        user=UserOut.model_validate(user, from_attributes=True),
        tokens=_tokens_for_user(user),
    ).model_dump()
    return success_response(request, data)


@router.post("/login", response_model=None)
async def login(
    payload: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session),
):
    user = await db.scalar(select(User).where(User.email == str(payload.email)))
    if user is None or not verify_password(payload.password, user.hashed_password):
        return error_response("INVALID_CREDENTIALS", "Invalid email or password", status_code=401)

    data = AuthResponse(
        user=UserOut.model_validate(user, from_attributes=True),
        tokens=_tokens_for_user(user),
    ).model_dump()
    return success_response(request, data)


@router.post("/refresh", response_model=None)
async def refresh(
    payload: RefreshRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session),
):
    try:
        decoded = decode_token(payload.refresh_token)
    except TokenError:
        return error_response("INVALID_TOKEN", "Invalid refresh token", status_code=401)

    if decoded.get("type") != "refresh":
        return error_response("INVALID_TOKEN", "Invalid refresh token", status_code=401)

    user_id = decoded.get("sub")
    if not user_id:
        return error_response("INVALID_TOKEN", "Invalid refresh token", status_code=401)

    user = await db.get(User, UUID(user_id))
    if user is None or not user.is_active:
        return error_response("USER_NOT_FOUND", "User not found", status_code=404)

    tokens = TokenPair(
        access_token=create_access_token(subject=str(user.id)),
        refresh_token=create_refresh_token(subject=str(user.id)),
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )

    return success_response(request, {"tokens": tokens.model_dump()})


async def get_current_user(
    db: AsyncSession = Depends(get_db_session),
    authorization: str | None = Header(default=None),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise TokenError("Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    decoded = decode_token(token)
    if decoded.get("type") != "access":
        raise TokenError("Invalid token")

    user_id = decoded.get("sub")
    if not user_id:
        raise TokenError("Invalid token")

    user = await db.get(User, UUID(user_id))
    if user is None or not user.is_active:
        raise TokenError("Invalid token")

    return user


@router.get("/me", response_model=None)
async def me(
    request: Request,
    user: User = Depends(get_current_user),
):
    data = {"user": UserOut.model_validate(user, from_attributes=True).model_dump()}
    return success_response(request, data)
