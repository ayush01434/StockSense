from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from app.core.exceptions import AuthenticationError, AuthorizationError
from app.integrations.supabase_client import SupabaseClientManager
from app.security.permissions import permission_allowed
from app.security.roles import DEFAULT_ROLE_PERMISSIONS, Role, normalize_role

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None
    role: Role
    permissions: set[str] = field(default_factory=set)
    warehouse_id: str | None = None
    claims: dict[str, Any] = field(default_factory=dict)

    def has_permission(self, permission: str) -> bool:
        return permission_allowed(self.permissions, permission)


class AuthService:
    def __init__(self, manager: SupabaseClientManager) -> None:
        self.manager = manager

    def verify_token(self, token: str) -> CurrentUser:
        if not token:
            raise AuthenticationError()
        try:
            client = self.manager.get_auth_client()
            user = None
            get_user = getattr(client.auth, "get_user", None)
            if callable(get_user):
                response = get_user(token)
                user = getattr(response, "user", None)
                if user is None and isinstance(response, dict):
                    user = response.get("user")
            if user is None:
                get_claims = getattr(client.auth, "get_claims", None)
                if callable(get_claims):
                    response = get_claims(token)
                    claims = self._extract_claims(response) or {}
                    user = {"id": claims.get("sub"), "email": claims.get("email"), "app_metadata": claims.get("app_metadata", {}), "user_metadata": claims.get("user_metadata", {}), "claims": claims}
            if user is None:
                raise AuthenticationError("Invalid or expired access token.")
            data = user if isinstance(user, dict) else vars(user)
            uid = str(data.get("id") or data.get("sub") or "")
            if not uid:
                raise AuthenticationError("Access token does not contain a user id.")
            app_meta = data.get("app_metadata") or {}
            user_meta = data.get("user_metadata") or {}
            claims = data.get("claims") if isinstance(data.get("claims"), dict) else {}
            role = normalize_role(app_meta.get("role") or user_meta.get("role") or claims.get("role"))
            warehouse_id = user_meta.get("warehouse_id") or app_meta.get("warehouse_id")
            profile = self._load_profile(uid)
            if profile:
                warehouse_id = profile.get("warehouse_id") or warehouse_id
                role = normalize_role(profile.get("role") or role.value)
            permissions = self._load_permissions(role, uid)
            return CurrentUser(id=uid, email=data.get("email"), role=role, permissions=permissions, warehouse_id=warehouse_id, claims=claims)
        except AuthenticationError:
            raise
        except Exception as exc:
            logger.warning("Authentication failure: %s", exc)
            raise AuthenticationError("Invalid or expired access token.") from exc

    @staticmethod
    def _extract_claims(response: Any) -> dict[str, Any] | None:
        claims = getattr(response, "claims", None)
        if isinstance(claims, dict): return claims
        if isinstance(response, dict) and isinstance(response.get("claims"), dict): return response["claims"]
        return None

    def _load_profile(self, user_id: str) -> dict[str, Any] | None:
        try:
            response = self.manager.get_admin().table("profiles").select("id,role_id,warehouse_id").eq("id", user_id).maybe_single().execute()
            profile = response.data or None
            if not profile: return None
            role_id = profile.get("role_id")
            if role_id:
                role_row = self.manager.get_admin().table("roles").select("name").eq("id", role_id).maybe_single().execute()
                profile["role"] = (role_row.data or {}).get("name")
            return profile
        except Exception:
            return None

    def _load_permissions(self, role: Role, user_id: str) -> set[str]:
        defaults = set(DEFAULT_ROLE_PERMISSIONS[role])
        try:
            profile = self._load_profile(user_id)
            if not profile or not profile.get("role_id"):
                return defaults
            rows = self.manager.get_admin().table("role_permissions").select("permissions(code)").eq("role_id", profile["role_id"]).execute().data or []
            found: set[str] = set()
            for row in rows:
                nested = row.get("permissions")
                if isinstance(nested, dict) and nested.get("code"): found.add(str(nested["code"]))
                elif isinstance(nested, list):
                    found.update(str(x["code"]) for x in nested if isinstance(x, dict) and x.get("code"))
            return found or defaults
        except Exception:
            return defaults


def require_permission(user: CurrentUser, permission: str) -> None:
    if not user.has_permission(permission):
        raise AuthorizationError(f"Missing permission: {permission}")


def require_role(user: CurrentUser, *roles: Role) -> None:
    if user.role is Role.ADMIN or user.role in roles:
        return
    raise AuthorizationError("Required role: " + ", ".join(r.value for r in roles))
