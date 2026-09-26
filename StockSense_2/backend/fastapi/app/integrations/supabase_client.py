from __future__ import annotations

import logging
from functools import lru_cache
from threading import Lock
from typing import Any

from supabase import Client, create_client
from supabase.lib.client_options import ClientOptions

from app.config import Settings, get_settings
from app.core.exceptions import ServiceUnavailableError

logger = logging.getLogger(__name__)


class SupabaseClientManager:
    """
    Centralized Supabase client manager.

    Responsibilities:
    - Create reusable clients.
    - Keep credentials out of business logic.
    - Disable session persistence for backend processes.
    - Expose separate public/auth and service-role clients.
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._public_client: Client | None = None
        self._admin_client: Client | None = None
        self._lock = Lock()

    @property
    def configured(self) -> bool:
        return bool(
            self.settings.supabase_url
            and self.settings.supabase_key
        )

    def _options(self) -> ClientOptions:
        return ClientOptions(
            postgrest_client_timeout=self.settings.supabase_timeout_seconds,
            storage_client_timeout=self.settings.supabase_timeout_seconds,
            auto_refresh_token=False,
            persist_session=False,
        )

    def get_public(self) -> Client:
        if not self.settings.supabase_url or not self.settings.supabase_key:
            raise ServiceUnavailableError(
                "Supabase public credentials are not configured."
            )

        if self._public_client is None:
            with self._lock:
                if self._public_client is None:
                    self._public_client = create_client(
                        self.settings.supabase_url,
                        self.settings.supabase_key,
                        options=self._options(),
                    )

        return self._public_client

    def get_admin(self) -> Client:
        if (
            not self.settings.supabase_url
            or not self.settings.supabase_service_role_key
        ):
            raise ServiceUnavailableError(
                "Supabase service-role credentials are not configured."
            )

        if self._admin_client is None:
            with self._lock:
                if self._admin_client is None:
                    self._admin_client = create_client(
                        self.settings.supabase_url,
                        self.settings.supabase_service_role_key,
                        options=self._options(),
                    )

        return self._admin_client

    def get_auth_client(self) -> Client:
        """
        Auth requests prefer the public/publishable key.
        """
        if self.settings.supabase_url and self.settings.supabase_key:
            return self.get_public()

        if (
            self.settings.supabase_url
            and self.settings.supabase_service_role_key
        ):
            return self.get_admin()

        raise ServiceUnavailableError(
            "Supabase credentials are not configured."
        )

    def healthcheck(self) -> dict[str, Any]:
        if not self.configured:
            return {
                "configured": False,
                "reachable": False,
                "message": "Supabase is not configured.",
            }

        try:
            client = (
                self.get_admin()
                if self.settings.supabase_service_role_key
                else self.get_public()
            )

            client.table("profiles").select("id").limit(1).execute()

            return {
                "configured": True,
                "reachable": True,
            }

        except Exception as exc:
            logger.warning("Supabase healthcheck failed: %s", exc)

            return {
                "configured": True,
                "reachable": False,
                "message": str(exc),
            }


@lru_cache(maxsize=1)
def get_supabase_manager() -> SupabaseClientManager:
    return SupabaseClientManager(get_settings())
    