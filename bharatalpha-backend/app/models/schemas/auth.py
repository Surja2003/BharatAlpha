from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class Meta(BaseModel):
    timestamp: str
    cached: bool = False
    latency_ms: int = 0
    data_source: str = "internal"
    disclaimer: str = (
        "BharatAlpha signals are for educational purposes only and are not financial advice. "
        "Past performance is not indicative of future results. "
        "Always consult a SEBI registered investment advisor before investing."
    )


class EnvelopeSuccess(BaseModel):
    success: bool = True
    data: Any
    meta: Meta


class ErrorInfo(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class EnvelopeError(BaseModel):
    success: bool = False
    error: ErrorInfo


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=15)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str | None = None
    phone: str | None = None
    is_active: bool
    is_verified: bool
    plan: str
    created_at: datetime


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in_minutes: int


class AuthResponse(BaseModel):
    user: UserOut
    tokens: TokenPair
