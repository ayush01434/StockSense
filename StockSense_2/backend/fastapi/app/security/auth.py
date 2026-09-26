from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
)
from app.integrations.supabase_client import (
    SupabaseClientManager,
)
from app.security.permissions import permission_allowed
from app.security.roles import (
    DEFAULT_ROLE_PERMISSIONS,
    Role,
    normalize_role,
)

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None
    role: Role

    permissions: set[str] = field(
        default_factory=set
    )

    warehouse_id: str | None = None

    claims: dict[str, Any] = field(
        default_factory=dict
    )

    def has_permission(
        self,
        permission: str,
    ) -> bool:
        return permission_allowed(
            self.permissions,
            permission,
        )


class AuthService:
    def __init__(
        self,
        manager: SupabaseClientManager,
    ) -> None:
        self.manager = manager

    def verify_token(
        self,
        token: str,
    ) -> CurrentUser:

        if not token:
            raise AuthenticationError()

        try:
            client = self.manager.get_auth_client()

            claims: dict[str, Any] | None = None

            get_claims = getattr(
                client.auth,
                "get_claims",
                None,
            )

            if callable(get_claims):
                response = get_claims(token)
                claims = self._extract_claims(response)

            if not claims:
                raise AuthenticationError(
                    "Unable to verify access token."
                )

            user_id = str(
                claims.get("sub") or ""
            )

            if not user_id:
                raise AuthenticationError(
                    "Access token does not contain a user id."
                )

            email = claims.get("email")

            app_metadata = (
                claims.get("app_metadata")
                or {}
            )

            user_metadata = (
                claims.get("user_metadata")
                or {}
            )

            role_value = (
                app_metadata.get("role")
                or user_metadata.get("role")
                or claims.get("role")
                or claims.get("role_name")
            )

            role = normalize_role(role_value)

            warehouse_id = (
                user_metadata.get("warehouse_id")
                or app_metadata.get("warehouse_id")
            )

            profile = self._load_profile(
                user_id
            )

            if profile:
                warehouse_id = (
                    profile.get("warehouse_id")
                    or warehouse_id
                )

                role_value = (
                    profile.get("role")
                )

                if role_value:
                    role = normalize_role(
                        str(role_value)
                    )

                profile_permissions = (
                    profile.get("permissions")
                )

                if profile_permissions:
                    permissions = set(
                        profile_permissions
                    )
                else:
                    permissions = (
                        self._load_permissions(
                            role=role,
                            user_id=user_id,
                        )
                    )
            else:
                permissions = (
                    self._load_permissions(
                        role=role,
                        user_id=user_id,
                    )
                )

            return CurrentUser(
                id=user_id,
                email=email,
                role=role,
                permissions=permissions,
                warehouse_id=warehouse_id,
                claims=claims,
            )

        except AuthenticationError:
            raise

        except Exception as exc:
            logger.warning(
                "Authentication failure: %s",
                exc,
            )

            raise AuthenticationError(
                "Invalid or expired access token."
            ) from exc

    @staticmethod
    def _extract_claims(
        response: Any,
    ) -> dict[str, Any] | None:

        if response is None:
            return None

        claims = getattr(
            response,
            "claims",
            None,
        )

        if isinstance(claims, dict):
            return claims

        if isinstance(response, dict):
            candidate = response.get(
                "claims"
            )

            if isinstance(candidate, dict):
                return candidate

        return None

    def _load_profile(
        self,
        user_id: str,
    ) -> dict[str, Any] | None:

        try:
            client = self.manager.get_admin()

            response = (
                client
                .table("profiles")
                .select(
                    "id,role_id,warehouse_id"
                )
                .eq("id", user_id)
                .maybe_single()
                .execute()
            )

            profile = response.data

            if not profile:
                return None

            role_id = profile.get(
                "role_id"
            )

            if role_id:
                role_response = (
                    client
                    .table("roles")
                    .select("name")
                    .eq("id", role_id)
                    .maybe_single()
                    .execute()
                )

                role_data = (
                    role_response.data
                    or {}
                )

                profile["role"] = (
                    role_data.get("name")
                )

            return profile

        except Exception as exc:
            logger.warning(
                "Profile lookup failed: %s",
                exc,
            )

            return None

    def _load_permissions(
        self,
        *,
        role: Role,
        user_id: str,
    ) -> set[str]:

        defaults = set(
            DEFAULT_ROLE_PERMISSIONS[role]
        )

        try:
            profile = self._load_profile(
                user_id
            )

            if not profile:
                return defaults

            role_id = profile.get(
                "role_id"
            )

            if not role_id:
                return defaults

            client = self.manager.get_admin()

            response = (
                client
                .table("role_permissions")
                .select(
                    "permissions(code)"
                )
                .eq(
                    "role_id",
                    role_id,
                )
                .execute()
            )

            rows = response.data or []

            permissions: set[str] = set()

            for row in rows:
                nested = row.get(
                    "permissions"
                )

                if isinstance(
                    nested,
                    dict,
                ):
                    code = nested.get("code")

                    if code:
                        permissions.add(
                            str(code)
                        )

                elif isinstance(
                    nested,
                    list,
                ):
                    for item in nested:
                        if isinstance(
                            item,
                            dict,
                        ):
                            code = item.get(
                                "code"
                            )

                            if code:
                                permissions.add(
                                    str(code)
                                )

            return (
                permissions
                or defaults
            )

        except Exception as exc:
            logger.warning(
                "Permission lookup failed: %s",
                exc,
            )

            return defaults


def require_permission(
    user: CurrentUser,
    permission: str,
) -> None:

    if not user.has_permission(
        permission
    ):
        raise AuthorizationError(
            f"Missing permission: {permission}"
        )


def require_role(
    user: CurrentUser,
    *roles: Role,
) -> None:

    if (
        user.role is Role.ADMIN
        or user.role in roles
    ):
        return

    required = ", ".join(
        role.value
        for role in roles
    )

    raise AuthorizationError(
        f"Required role: {required}"
    )