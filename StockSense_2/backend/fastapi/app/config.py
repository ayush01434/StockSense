from __future__ import annotations

from functools import lru_cache
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "StockSense API"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = False

    api_v1_prefix: str = "/api/v1"

    cors_origins: str = "http://localhost:3000"
    cors_allow_credentials: bool = True

    supabase_url: str = ""
    supabase_publishable_key: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_timeout_seconds: float = 10.0

    storage_bucket: str = "avatars"

    default_page_size: int = 20
    max_page_size: int = 100

    log_level: str = "INFO"
    request_id_header: str = "X-Request-ID"

    allow_docs_in_production: bool = False

    @field_validator("default_page_size", "max_page_size")
    @classmethod
    def validate_page_size(cls, value: int) -> int:
        if value < 1:
            raise ValueError("Page size must be greater than zero.")
        return value

    @property
    def supabase_key(self) -> str:
        return self.supabase_publishable_key or self.supabase_anon_key

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def docs_url(self) -> str | None:
        if self.environment.lower() == "production" and not self.allow_docs_in_production:
            return None
        return "/docs"

    @property
    def redacted(self) -> dict[str, Any]:
        return {
            "app_name": self.app_name,
            "app_version": self.app_version,
            "environment": self.environment,
            "debug": self.debug,
            "supabase_configured": bool(
                self.supabase_url and self.supabase_key
            ),
            "service_role_configured": bool(
                self.supabase_service_role_key
            ),
        }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()