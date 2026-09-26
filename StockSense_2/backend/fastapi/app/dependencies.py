from __future__ import annotations

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, Header

from app.config import Settings, get_settings
from app.core.exceptions import AuthenticationError
from app.integrations.supabase_client import SupabaseClientManager, get_supabase_manager
from app.security.auth import AuthService, CurrentUser, require_permission


def get_app_settings() -> Settings:
    return get_settings()


def get_supabase_manager_dependency() -> SupabaseClientManager:
    return get_supabase_manager()


def get_auth_service() -> AuthService:
    return AuthService(get_supabase_manager())


def get_bearer_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization:
        raise AuthenticationError()
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise AuthenticationError("Authorization header must use Bearer authentication.")
    return token.strip()


def get_current_user(token: Annotated[str, Depends(get_bearer_token)], auth_service: Annotated[AuthService, Depends(get_auth_service)]) -> CurrentUser:
    return auth_service.verify_token(token)


def permission_dependency(permission: str) -> Callable:
    def dependency(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
        require_permission(user, permission)
        return user
    return dependency
