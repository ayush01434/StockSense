# StockSense backend replacement script
# Run this script from the StockSense_2 repository root.
$ErrorActionPreference = "Stop"
$root = (Get-Location).Path
if (-not (Test-Path (Join-Path $root "backend\fastapi"))) { throw "Run this script from StockSense_2 repository root." }
$files = @{
    'backend\fastapi\.env.example' = @'
APP_NAME=StockSense API
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=false
API_V1_PREFIX=/api/v1
CORS_ORIGINS=http://localhost:3000
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_TIMEOUT_SECONDS=10
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
LOG_LEVEL=INFO

'@
    'backend\fastapi\pyproject.toml' = @'
[project]
name = "stocksense-fastapi"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = [
  "fastapi>=0.115,<1.0",
  "pydantic>=2.7,<3.0",
  "pydantic-settings>=2.4,<3.0",
  "supabase>=2.15,<3.0",
  "uvicorn[standard]>=0.30,<1.0",
]

[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]

'@
    'backend\fastapi\requirements.txt' = @'
fastapi>=0.115,<1.0
pydantic>=2.7,<3.0
pydantic-settings>=2.4,<3.0
supabase>=2.15,<3.0
uvicorn[standard]>=0.30,<1.0

'@
    'backend\fastapi\Dockerfile' = @'

'@
    'backend\fastapi\app\__init__.py' = @'

'@
    'backend\fastapi\app\main.py' = @'
from __future__ import annotations

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.config import get_settings
from app.core.exceptions import AppError
from app.core.logging import configure_logging
from app.core.responses import success_response
from app.integrations.supabase_client import get_supabase_manager

settings=get_settings(); configure_logging(settings.log_level); logger=logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s", settings.app_name); logger.info("Configuration: %s", settings.redacted); yield; logger.info("Stopping %s", settings.app_name)

app=FastAPI(title=settings.app_name,version=settings.app_version,debug=settings.debug,docs_url=settings.docs_url,redoc_url="/redoc" if settings.docs_url else None,openapi_url="/openapi.json" if settings.docs_url else None,lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=settings.cors_origin_list,allow_credentials=settings.cors_allow_credentials,allow_methods=["*"],allow_headers=["*"])

@app.middleware("http")
async def request_context(request: Request, call_next):
    rid=request.headers.get(settings.request_id_header) or str(uuid.uuid4()); request.state.request_id=rid; started=time.perf_counter()
    try: response=await call_next(request)
    except Exception: logger.exception("Unhandled request error"); raise
    response.headers[settings.request_id_header]=rid; response.headers["X-Process-Time-ms"]=f"{(time.perf_counter()-started)*1000:.2f}"; return response

@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code,content={"success":False,"message":exc.message,"code":exc.code,"details":exc.details,"request_id":getattr(request.state,"request_id",None)})

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422,content={"success":False,"message":"Request validation failed.","code":"VALIDATION_ERROR","details":exc.errors(),"request_id":getattr(request.state,"request_id",None)})

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled application exception")
    return JSONResponse(status_code=500,content={"success":False,"message":"Internal server error.","code":"INTERNAL_SERVER_ERROR","details":None,"request_id":getattr(request.state,"request_id",None)})

@app.get("/health",tags=["Health"])
def health(): return success_response(data={"status":"ok","service":settings.app_name,"version":settings.app_version,"environment":settings.environment},message="Service is healthy.")

@app.get("/ready",tags=["Health"])
def readiness():
    status=get_supabase_manager().healthcheck(); ready=status.get("reachable",False)
    return success_response(data={"status":"ready" if ready else "degraded","supabase":status},message="Readiness check completed.")

app.include_router(api_router,prefix=settings.api_v1_prefix)

'@
    'backend\fastapi\app\dependencies.py' = @'
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

'@
    'backend\fastapi\app\config.py' = @'
from __future__ import annotations

from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator
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
    supabase_timeout_seconds: float = Field(default=10.0, gt=0, le=120)

    storage_bucket: str = "avatars"
    default_page_size: int = Field(default=20, ge=1)
    max_page_size: int = Field(default=100, ge=1)
    log_level: str = "INFO"
    request_id_header: str = "X-Request-ID"
    allow_docs_in_production: bool = False

    @field_validator("max_page_size")
    @classmethod
    def max_page_size_must_cover_default(cls, value: int, info):
        default = info.data.get("default_page_size", 20)
        if value < default:
            raise ValueError("max_page_size must be >= default_page_size")
        return value

    @property
    def supabase_key(self) -> str:
        return self.supabase_publishable_key or self.supabase_anon_key

    @property
    def cors_origin_list(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]

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
            "supabase_configured": bool(self.supabase_url and self.supabase_key),
            "service_role_configured": bool(self.supabase_url and self.supabase_service_role_key),
        }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

'@
    'backend\fastapi\app\security\auth.py' = @'
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

'@
    'backend\fastapi\app\security\roles.py' = @'
from __future__ import annotations

from enum import StrEnum


class Role(StrEnum):
    ADMIN = "admin"
    MANAGER = "manager"
    STAFF = "staff"


DEFAULT_ROLE_PERMISSIONS: dict[Role, set[str]] = {
    Role.ADMIN: {"*"},
    Role.MANAGER: {
        "dashboard.read", "products.read", "products.write", "categories.read", "categories.write",
        "inventory.read", "receipts.read", "receipts.write", "deliveries.read", "deliveries.write",
        "transfers.read", "transfers.write", "adjustments.read", "adjustments.write", "ledger.read",
        "warehouses.read", "warehouses.write", "locations.read", "locations.write", "suppliers.read",
        "suppliers.write", "alerts.read", "profile.read", "profile.write", "settings.read", "settings.write",
    },
    Role.STAFF: {
        "dashboard.read", "products.read", "categories.read", "inventory.read", "receipts.read", "receipts.write",
        "deliveries.read", "deliveries.write", "transfers.read", "transfers.write", "adjustments.read", "ledger.read",
        "warehouses.read", "locations.read", "suppliers.read", "alerts.read", "profile.read", "profile.write",
    },
}


def normalize_role(value: str | None) -> Role:
    if not value:
        return Role.STAFF
    try:
        return Role(str(value).strip().lower())
    except ValueError:
        return Role.STAFF

'@
    'backend\fastapi\app\security\__init__.py' = @'

'@
    'backend\fastapi\app\security\permissions.py' = @'
from __future__ import annotations

from enum import StrEnum


class Permission(StrEnum):
    DASHBOARD_READ = "dashboard.read"
    PRODUCTS_READ = "products.read"; PRODUCTS_WRITE = "products.write"
    CATEGORIES_READ = "categories.read"; CATEGORIES_WRITE = "categories.write"
    INVENTORY_READ = "inventory.read"
    RECEIPTS_READ = "receipts.read"; RECEIPTS_WRITE = "receipts.write"
    DELIVERIES_READ = "deliveries.read"; DELIVERIES_WRITE = "deliveries.write"
    TRANSFERS_READ = "transfers.read"; TRANSFERS_WRITE = "transfers.write"
    ADJUSTMENTS_READ = "adjustments.read"; ADJUSTMENTS_WRITE = "adjustments.write"
    LEDGER_READ = "ledger.read"
    WAREHOUSES_READ = "warehouses.read"; WAREHOUSES_WRITE = "warehouses.write"
    LOCATIONS_READ = "locations.read"; LOCATIONS_WRITE = "locations.write"
    SUPPLIERS_READ = "suppliers.read"; SUPPLIERS_WRITE = "suppliers.write"
    ALERTS_READ = "alerts.read"
    PROFILE_READ = "profile.read"; PROFILE_WRITE = "profile.write"
    SETTINGS_READ = "settings.read"; SETTINGS_WRITE = "settings.write"


def permission_allowed(granted: set[str], required: str) -> bool:
    return "*" in granted or required in granted

'@
    'backend\fastapi\app\utils\sku.py' = @'
from __future__ import annotations

import re
import secrets


def normalize_sku(value: str) -> str:
    value = re.sub(r"[^A-Za-z0-9_-]+", "-", value.strip()).strip("-")
    if not value:
        raise ValueError("SKU cannot be empty")
    return value.upper()


def generate_sku(prefix: str = "SKU") -> str:
    return f"{normalize_sku(prefix)}-{secrets.token_hex(4).upper()}"

'@
    'backend\fastapi\app\utils\filters.py' = @'
from __future__ import annotations


def search_pattern(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    # Escape PostgREST wildcard characters so a normal search string cannot change the pattern.
    value = value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{value}%"

'@
    'backend\fastapi\app\utils\__init__.py' = @'

'@
    'backend\fastapi\app\utils\pagination.py' = @'
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Pagination:
    page: int
    page_size: int

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def end(self) -> int:
        return self.offset + self.page_size - 1


def normalize_pagination(page: int, page_size: int, *, max_page_size: int, default_page_size: int) -> Pagination:
    safe_page = max(1, int(page or 1))
    safe_size = int(page_size or default_page_size)
    safe_size = max(1, min(safe_size, max_page_size))
    return Pagination(safe_page, safe_size)

'@
    'backend\fastapi\app\services\resource_service.py' = @'
from __future__ import annotations

from typing import Any
from app.repositories.resource_repository import ResourceRepository
from app.utils.pagination import Pagination


class ResourceService:
    def __init__(self, repository: ResourceRepository) -> None:
        self.repository = repository

    def list(self, **kwargs: Any): return self.repository.list(**kwargs)
    def get(self, identifier: str): return self.repository.get(identifier)
    def create(self, payload: dict[str, Any]): return self.repository.create(payload)
    def update(self, identifier: str, payload: dict[str, Any]): return self.repository.update(identifier, payload)
    def delete(self, identifier: str): return self.repository.delete(identifier)

'@
    'backend\fastapi\app\services\ledger_service.py' = @'
from typing import Any
from app.repositories.ledger_repository import LedgerRepository

class LedgerService:
    def __init__(self, repository: LedgerRepository): self.repository=repository
    def list(self, **kwargs: Any): return self.repository.list(**kwargs)
    def get(self, identifier: str): return self.repository.get(identifier)
    def create(self, payload: dict[str, Any]): return self.repository.create(payload)
    def update(self, identifier: str, payload: dict[str, Any]): return self.repository.update(identifier,payload)
    def delete(self, identifier: str): return self.repository.delete(identifier)

'@
    'backend\fastapi\app\services\warehouse_service.py' = @'
from typing import Any
from app.repositories.warehouse_repository import WarehouseRepository

class WarehouseService:
    def __init__(self, repository: WarehouseRepository): self.repository=repository
    def list(self, **kwargs: Any): return self.repository.list(**kwargs)
    def get(self, identifier: str): return self.repository.get(identifier)
    def create(self, payload: dict[str, Any]): return self.repository.create(payload)
    def update(self, identifier: str, payload: dict[str, Any]): return self.repository.update(identifier,payload)
    def delete(self, identifier: str): return self.repository.delete(identifier)

'@
    'backend\fastapi\app\services\_transaction_service.py' = @'
from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from supabase import Client
from app.core.exceptions import ConflictError, ServiceUnavailableError

logger = logging.getLogger(__name__)


class InventoryTransactionService:
    ALLOWED_FUNCTIONS = {"receive_stock", "deliver_stock", "transfer_stock", "adjust_stock"}

    def __init__(self, client: Client) -> None:
        self.client = client

    def call(self, function_name: str, payload: dict[str, Any], actor_id: UUID | str) -> dict[str, Any]:
        if function_name not in self.ALLOWED_FUNCTIONS:
            raise ConflictError(f"Unsupported inventory operation: {function_name}")
        try:
            response = self.client.rpc(function_name, {"p_payload": payload, "p_actor_id": str(actor_id)}).execute()
            data = response.data
            if isinstance(data, list) and len(data) == 1: data = data[0]
            return data if isinstance(data, dict) else {"result": data}
        except Exception as exc:
            logger.exception("Inventory RPC failed: %s", function_name)
            raise ServiceUnavailableError(f"Inventory operation '{function_name}' failed. Check Supabase RPC/migrations.") from exc

'@
    'backend\fastapi\app\services\inventory_service.py' = @'
from __future__ import annotations

from decimal import Decimal
from typing import Any
from uuid import UUID

from app.repositories.resource_repository import ResourceRepository
from app.services._transaction_service import InventoryTransactionService


class InventoryService:
    def __init__(self, repository: ResourceRepository, transactions: InventoryTransactionService | None = None) -> None:
        self.repository = repository
        self.transactions = transactions

    def list_inventory(self, **kwargs: Any): return self.repository.list(**kwargs)
    def get_inventory(self, inventory_id: UUID): return self.repository.get(str(inventory_id))

    def product_summary(self, product_id: UUID | None = None) -> list[dict[str, Any]]:
        rows, _ = self.repository.list(pagination=type("P", (), {"offset":0,"end":9999})(), filters={"product_id": product_id}, order_by="created_at")
        grouped: dict[str, dict[str, Any]] = {}
        for row in rows:
            pid = str(row.get("product_id"))
            item = grouped.setdefault(pid, {"product_id": pid, "product_name": None, "sku": None, "total_quantity": Decimal("0"), "total_reserved": Decimal("0")})
            item["total_quantity"] += Decimal(str(row.get("quantity") or 0))
            item["total_reserved"] += Decimal(str(row.get("reserved_quantity") or 0))
        for item in grouped.values(): item["total_available"] = item["total_quantity"] - item["total_reserved"]
        return [{**x, "total_quantity": str(x["total_quantity"]), "total_reserved": str(x["total_reserved"]), "total_available": str(x["total_available"])} for x in grouped.values()]

    def transact(self, function_name: str, payload: dict[str, Any], actor_id: UUID | str) -> dict[str, Any]:
        if self.transactions is None: raise RuntimeError("Transaction service is not configured")
        return self.transactions.call(function_name, payload, actor_id)

'@
    'backend\fastapi\app\services\delivery_service.py' = @'
from typing import Any
from app.repositories.delivery_repository import DeliveryRepository

class DeliveryService:
    def __init__(self, repository: DeliveryRepository): self.repository=repository
    def list(self, **kwargs: Any): return self.repository.list(**kwargs)
    def get(self, identifier: str): return self.repository.get(identifier)
    def create(self, payload: dict[str, Any]): return self.repository.create(payload)
    def update(self, identifier: str, payload: dict[str, Any]): return self.repository.update(identifier,payload)
    def delete(self, identifier: str): return self.repository.delete(identifier)

'@
    'backend\fastapi\app\services\transfer_service.py' = @'
from typing import Any
from app.repositories.transfer_repository import TransferRepository

class TransferService:
    def __init__(self, repository: TransferRepository): self.repository=repository
    def list(self, **kwargs: Any): return self.repository.list(**kwargs)
    def get(self, identifier: str): return self.repository.get(identifier)
    def create(self, payload: dict[str, Any]): return self.repository.create(payload)
    def update(self, identifier: str, payload: dict[str, Any]): return self.repository.update(identifier,payload)
    def delete(self, identifier: str): return self.repository.delete(identifier)

'@
    'backend\fastapi\app\services\__init__.py' = @'

'@
    'backend\fastapi\app\services\location_service.py' = @'
from typing import Any
from app.repositories.location_repository import LocationRepository

class LocationService:
    def __init__(self, repository: LocationRepository): self.repository=repository
    def list(self, **kwargs: Any): return self.repository.list(**kwargs)
    def get(self, identifier: str): return self.repository.get(identifier)
    def create(self, payload: dict[str, Any]): return self.repository.create(payload)
    def update(self, identifier: str, payload: dict[str, Any]): return self.repository.update(identifier,payload)
    def delete(self, identifier: str): return self.repository.delete(identifier)

'@
    'backend\fastapi\app\services\product_service.py' = @'
from typing import Any
from app.repositories.product_repository import ProductRepository

class ProductService:
    def __init__(self, repository: ProductRepository): self.repository=repository
    def list(self, **kwargs: Any): return self.repository.list(**kwargs)
    def get(self, identifier: str): return self.repository.get(identifier)
    def create(self, payload: dict[str, Any]): return self.repository.create(payload)
    def update(self, identifier: str, payload: dict[str, Any]): return self.repository.update(identifier,payload)
    def delete(self, identifier: str): return self.repository.delete(identifier)

'@
    'backend\fastapi\app\services\supplier_service.py' = @'
from typing import Any
from app.repositories.supplier_repository import SupplierRepository

class SupplierService:
    def __init__(self, repository: SupplierRepository): self.repository=repository
    def list(self, **kwargs: Any): return self.repository.list(**kwargs)
    def get(self, identifier: str): return self.repository.get(identifier)
    def create(self, payload: dict[str, Any]): return self.repository.create(payload)
    def update(self, identifier: str, payload: dict[str, Any]): return self.repository.update(identifier,payload)
    def delete(self, identifier: str): return self.repository.delete(identifier)

'@
    'backend\fastapi\app\services\receipt_service.py' = @'
from typing import Any
from app.repositories.receipt_repository import ReceiptRepository

class ReceiptService:
    def __init__(self, repository: ReceiptRepository): self.repository=repository
    def list(self, **kwargs: Any): return self.repository.list(**kwargs)
    def get(self, identifier: str): return self.repository.get(identifier)
    def create(self, payload: dict[str, Any]): return self.repository.create(payload)
    def update(self, identifier: str, payload: dict[str, Any]): return self.repository.update(identifier,payload)
    def delete(self, identifier: str): return self.repository.delete(identifier)

'@
    'backend\fastapi\app\services\category_service.py' = @'
from typing import Any
from app.repositories.category_repository import CategoryRepository

class CategoryService:
    def __init__(self, repository: CategoryRepository): self.repository=repository
    def list(self, **kwargs: Any): return self.repository.list(**kwargs)
    def get(self, identifier: str): return self.repository.get(identifier)
    def create(self, payload: dict[str, Any]): return self.repository.create(payload)
    def update(self, identifier: str, payload: dict[str, Any]): return self.repository.update(identifier,payload)
    def delete(self, identifier: str): return self.repository.delete(identifier)

'@
    'backend\fastapi\app\services\adjustment_service.py' = @'
from typing import Any
from app.repositories.adjustment_repository import AdjustmentRepository

class AdjustmentService:
    def __init__(self, repository: AdjustmentRepository): self.repository=repository
    def list(self, **kwargs: Any): return self.repository.list(**kwargs)
    def get(self, identifier: str): return self.repository.get(identifier)
    def create(self, payload: dict[str, Any]): return self.repository.create(payload)
    def update(self, identifier: str, payload: dict[str, Any]): return self.repository.update(identifier,payload)
    def delete(self, identifier: str): return self.repository.delete(identifier)

'@
    'backend\fastapi\app\repositories\ledger_repository.py' = @'
from supabase import Client
from app.repositories.resource_repository import ResourceRepository

class LedgerRepository(ResourceRepository):
    def __init__(self, client: Client):
        super().__init__(client, "ledgers")

'@
    'backend\fastapi\app\repositories\receipt_repository.py' = @'
from supabase import Client
from app.repositories.resource_repository import ResourceRepository

class ReceiptRepository(ResourceRepository):
    def __init__(self, client: Client):
        super().__init__(client, "receipts")

'@
    'backend\fastapi\app\repositories\location_repository.py' = @'
from supabase import Client
from app.repositories.resource_repository import ResourceRepository

class LocationRepository(ResourceRepository):
    def __init__(self, client: Client):
        super().__init__(client, "locations")

'@
    'backend\fastapi\app\repositories\warehouse_repository.py' = @'
from supabase import Client
from app.repositories.resource_repository import ResourceRepository

class WarehouseRepository(ResourceRepository):
    def __init__(self, client: Client):
        super().__init__(client, "warehouses")

'@
    'backend\fastapi\app\repositories\__init__.py' = @'

'@
    'backend\fastapi\app\repositories\category_repository.py' = @'
from supabase import Client
from app.repositories.resource_repository import ResourceRepository

class CategoryRepository(ResourceRepository):
    def __init__(self, client: Client):
        super().__init__(client, "categorys")

'@
    'backend\fastapi\app\repositories\inventory_repository.py' = @'
from supabase import Client
from app.repositories.resource_repository import ResourceRepository

class InventoryRepository(ResourceRepository):
    def __init__(self, client: Client):
        super().__init__(client, "inventory")
    def list_inventory(self, **kwargs): return self.list(**kwargs)
    def get_inventory(self, identifier: str): return self.get(identifier)
    def product_summary(self, product_id=None):
        rows, _ = self.list(pagination=type("P", (), {"offset":0,"end":9999})(), filters={"product_id": product_id})
        return rows

'@
    'backend\fastapi\app\repositories\base.py' = @'
from __future__ import annotations

import logging
from typing import Any

from supabase import Client

from app.core.exceptions import ConflictError, NotFoundError, ServiceUnavailableError
from app.utils.filters import search_pattern
from app.utils.pagination import Pagination

logger = logging.getLogger(__name__)


class BaseRepository:
    table_name: str = ""
    search_columns: tuple[str, ...] = ()

    def __init__(self, client: Client) -> None:
        if not self.table_name:
            raise ValueError("Repository table_name is required")
        self.client = client

    @staticmethod
    def _clean(value: Any) -> Any:
        if hasattr(value, "hex"):
            return str(value)
        return value

    def list(self, *, pagination: Pagination, filters: dict[str, Any] | None = None, search: str | None = None, order_by: str = "created_at", ascending: bool = False, select: str = "*") -> tuple[list[dict[str, Any]], int]:
        try:
            query = self.client.table(self.table_name).select(select, count="exact")
            for key, value in (filters or {}).items():
                if value is not None:
                    query = query.eq(key, self._clean(value))
            pattern = search_pattern(search)
            if pattern and self.search_columns:
                # PostgREST OR syntax: col.ilike.pattern,col2.ilike.pattern
                clauses = ",".join(f"{col}.ilike.{pattern}" for col in self.search_columns)
                query = query.or_(clauses)
            query = query.order(order_by, desc=not ascending)
            response = query.range(pagination.offset, pagination.end).execute()
            return response.data or [], int(getattr(response, "count", 0) or 0)
        except Exception as exc:
            logger.exception("List failed for %s", self.table_name)
            raise ServiceUnavailableError(f"Unable to query {self.table_name}.") from exc

    def get(self, identifier: str, *, select: str = "*") -> dict[str, Any]:
        try:
            response = self.client.table(self.table_name).select(select).eq("id", identifier).maybe_single().execute()
            if not response.data:
                raise NotFoundError(self.table_name, identifier)
            return response.data
        except NotFoundError:
            raise
        except Exception as exc:
            raise ServiceUnavailableError(f"Unable to query {self.table_name}.") from exc

    def create(self, payload: dict[str, Any], *, select: str = "*") -> dict[str, Any]:
        try:
            response = self.client.table(self.table_name).insert(payload).select(select).single().execute()
            if not response.data:
                raise ServiceUnavailableError(f"Insert returned no {self.table_name} row.")
            return response.data
        except Exception as exc:
            msg = str(exc).lower()
            if "duplicate" in msg or "unique" in msg:
                raise ConflictError(f"Duplicate value in {self.table_name}.") from exc
            raise ServiceUnavailableError(f"Unable to create {self.table_name}.") from exc

    def update(self, identifier: str, payload: dict[str, Any], *, select: str = "*") -> dict[str, Any]:
        try:
            response = self.client.table(self.table_name).update(payload).eq("id", identifier).select(select).maybe_single().execute()
            if not response.data:
                raise NotFoundError(self.table_name, identifier)
            return response.data
        except NotFoundError:
            raise
        except Exception as exc:
            raise ServiceUnavailableError(f"Unable to update {self.table_name}.") from exc

    def delete(self, identifier: str) -> None:
        try:
            response = self.client.table(self.table_name).delete().eq("id", identifier).execute()
            if not response.data:
                raise NotFoundError(self.table_name, identifier)
        except NotFoundError:
            raise
        except Exception as exc:
            raise ServiceUnavailableError(f"Unable to delete {self.table_name}.") from exc

'@
    'backend\fastapi\app\repositories\supplier_repository.py' = @'
from supabase import Client
from app.repositories.resource_repository import ResourceRepository

class SupplierRepository(ResourceRepository):
    def __init__(self, client: Client):
        super().__init__(client, "suppliers")

'@
    'backend\fastapi\app\repositories\delivery_repository.py' = @'
from supabase import Client
from app.repositories.resource_repository import ResourceRepository

class DeliveryRepository(ResourceRepository):
    def __init__(self, client: Client):
        super().__init__(client, "deliverys")

'@
    'backend\fastapi\app\repositories\resource_repository.py' = @'
from __future__ import annotations

from supabase import Client
from app.repositories.base import BaseRepository


class ResourceRepository(BaseRepository):
    def __init__(self, client: Client, table_name: str, search_columns: tuple[str, ...] = ()) -> None:
        self.table_name = table_name
        self.search_columns = search_columns
        super().__init__(client)

'@
    'backend\fastapi\app\repositories\adjustment_repository.py' = @'
from supabase import Client
from app.repositories.resource_repository import ResourceRepository

class AdjustmentRepository(ResourceRepository):
    def __init__(self, client: Client):
        super().__init__(client, "adjustments")

'@
    'backend\fastapi\app\repositories\transfer_repository.py' = @'
from supabase import Client
from app.repositories.resource_repository import ResourceRepository

class TransferRepository(ResourceRepository):
    def __init__(self, client: Client):
        super().__init__(client, "transfers")

'@
    'backend\fastapi\app\repositories\product_repository.py' = @'
from supabase import Client
from app.repositories.resource_repository import ResourceRepository

class ProductRepository(ResourceRepository):
    def __init__(self, client: Client):
        super().__init__(client, "products")

'@
    'backend\fastapi\app\integrations\__init__.py' = @'

'@
    'backend\fastapi\app\integrations\supabase_client.py' = @'
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
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._public: Client | None = None
        self._admin: Client | None = None
        self._lock = Lock()

    @property
    def configured(self) -> bool:
        return bool(self.settings.supabase_url and self.settings.supabase_key)

    def _options(self) -> ClientOptions:
        return ClientOptions(
            postgrest_client_timeout=self.settings.supabase_timeout_seconds,
            storage_client_timeout=self.settings.supabase_timeout_seconds,
            auto_refresh_token=False,
            persist_session=False,
        )

    def get_public(self) -> Client:
        if not self.settings.supabase_url or not self.settings.supabase_key:
            raise ServiceUnavailableError("Supabase public credentials are not configured.")
        if self._public is None:
            with self._lock:
                if self._public is None:
                    self._public = create_client(self.settings.supabase_url, self.settings.supabase_key, options=self._options())
        return self._public

    def get_admin(self) -> Client:
        if not self.settings.supabase_url or not self.settings.supabase_service_role_key:
            raise ServiceUnavailableError("Supabase service-role credentials are not configured.")
        if self._admin is None:
            with self._lock:
                if self._admin is None:
                    self._admin = create_client(self.settings.supabase_url, self.settings.supabase_service_role_key, options=self._options())
        return self._admin

    def get_auth_client(self) -> Client:
        if self.settings.supabase_url and self.settings.supabase_key:
            return self.get_public()
        if self.settings.supabase_url and self.settings.supabase_service_role_key:
            return self.get_admin()
        raise ServiceUnavailableError("Supabase credentials are not configured.")

    def healthcheck(self) -> dict[str, Any]:
        if not self.configured:
            return {"configured": False, "reachable": False, "message": "Supabase is not configured."}
        try:
            client = self.get_admin() if self.settings.supabase_service_role_key else self.get_public()
            client.table("profiles").select("id").limit(1).execute()
            return {"configured": True, "reachable": True}
        except Exception as exc:
            logger.warning("Supabase healthcheck failed: %s", exc)
            return {"configured": True, "reachable": False, "message": str(exc)}


@lru_cache(maxsize=1)
def get_supabase_manager() -> SupabaseClientManager:
    return SupabaseClientManager(get_settings())

'@
    'backend\fastapi\app\core\responses.py' = @'
from __future__ import annotations

from math import ceil
from typing import Any


def success_response(*, data: Any = None, message: str = "OK") -> dict[str, Any]:
    return {"success": True, "message": message, "data": data}


def paginated_response(data: list[Any], *, page: int, page_size: int, total: int, message: str = "OK") -> dict[str, Any]:
    pages = ceil(total / page_size) if page_size else 0
    return {
        "success": True,
        "message": message,
        "data": data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "pages": pages,
            "has_next": page < pages,
            "has_previous": page > 1,
        },
    }

'@
    'backend\fastapi\app\core\exceptions.py' = @'
from __future__ import annotations

from typing import Any


class AppError(Exception):
    def __init__(self, message: str, *, status_code: int = 400, code: str = "APP_ERROR", details: Any = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details


class NotFoundError(AppError):
    def __init__(self, resource: str, identifier: str | None = None):
        message = f"{resource} not found" + (f": {identifier}" if identifier else "")
        super().__init__(message, status_code=404, code="NOT_FOUND")


class ConflictError(AppError):
    def __init__(self, message: str, details: Any = None):
        super().__init__(message, status_code=409, code="CONFLICT", details=details)


class AuthenticationError(AppError):
    def __init__(self, message: str = "Authentication required."):
        super().__init__(message, status_code=401, code="UNAUTHORIZED")


class AuthorizationError(AppError):
    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(message, status_code=403, code="FORBIDDEN")


class ServiceUnavailableError(AppError):
    def __init__(self, message: str = "Required service is unavailable."):
        super().__init__(message, status_code=503, code="SERVICE_UNAVAILABLE")


class ValidationAppError(AppError):
    def __init__(self, message: str, details: Any = None):
        super().__init__(message, status_code=422, code="VALIDATION_ERROR", details=details)

'@
    'backend\fastapi\app\core\__init__.py' = @'

'@
    'backend\fastapi\app\core\logging.py' = @'
from __future__ import annotations

import logging


def configure_logging(level: str = "INFO") -> None:
    numeric = getattr(logging, level.upper(), logging.INFO)
    logging.basicConfig(
        level=numeric,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        force=True,
    )

'@
    'backend\fastapi\app\api\__init__.py' = @'

'@
    'backend\fastapi\app\schemas\__init__.py' = @'

'@
    'backend\fastapi\app\api\v1\categories.py' = @'
from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="categories", prefix="/categories", read_permission="categories.read", write_permission="categories.write", search_columns=('name',))

'@
    'backend\fastapi\app\api\v1\deliveries.py' = @'
from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="deliveries", prefix="/deliveries", read_permission="deliveries.read", write_permission="deliveries.write", search_columns=('reference', 'status'))

'@
    'backend\fastapi\app\api\v1\warehouses.py' = @'
from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="warehouses", prefix="/warehouses", read_permission="warehouses.read", write_permission="warehouses.write", search_columns=('name', 'code'))

'@
    'backend\fastapi\app\api\v1\suppliers.py' = @'
from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="suppliers", prefix="/suppliers", read_permission="suppliers.read", write_permission="suppliers.write", search_columns=('name', 'email'))

'@
    'backend\fastapi\app\api\v1\router.py' = @'
from fastapi import APIRouter
from app.api.v1 import adjustments, alerts, categories, dashboard, deliveries, inventory, ledger, locations, products, profile, receipts, suppliers, transfers, warehouses
api_router=APIRouter()
for _module in (dashboard,products,categories,inventory,receipts,deliveries,transfers,adjustments,ledger,warehouses,locations,suppliers,alerts,profile):
    api_router.include_router(_module.router)

'@
    'backend\fastapi\app\api\v1\__init__.py' = @'

'@
    'backend\fastapi\app\api\v1\dashboard.py' = @'
from fastapi import APIRouter
from app.core.responses import success_response
router=APIRouter(prefix="/dashboard", tags=["Dashboard"])
@router.get("")
def dashboard(): return success_response(data={})

'@
    'backend\fastapi\app\api\v1\locations.py' = @'
from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="locations", prefix="/locations", read_permission="locations.read", write_permission="locations.write", search_columns=('name', 'code'))

'@
    'backend\fastapi\app\api\v1\ledger.py' = @'
from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="ledger", prefix="/ledger", read_permission="ledger.read", write_permission="ledger.read", search_columns=('reference', 'movement_type'))

'@
    'backend\fastapi\app\api\v1\products.py' = @'
from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="products", prefix="/products", read_permission="products.read", write_permission="products.write", search_columns=('name', 'sku'))

'@
    'backend\fastapi\app\api\v1\alerts.py' = @'
from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="alerts", prefix="/alerts", read_permission="alerts.read", write_permission="alerts.read", search_columns=('title', 'type'))

'@
    'backend\fastapi\app\api\v1\transfers.py' = @'
from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="transfers", prefix="/transfers", read_permission="transfers.read", write_permission="transfers.write", search_columns=('reference', 'status'))

'@
    'backend\fastapi\app\api\v1\adjustments.py' = @'
from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="adjustments", prefix="/adjustments", read_permission="adjustments.read", write_permission="adjustments.write", search_columns=('reference', 'status'))

'@
    'backend\fastapi\app\api\v1\inventory.py' = @'
from __future__ import annotations

from typing import Any
from uuid import UUID
from fastapi import APIRouter, Body, Depends, Query
from app.config import get_settings
from app.core.responses import paginated_response, success_response
from app.dependencies import get_supabase_manager_dependency, permission_dependency
from app.integrations.supabase_client import SupabaseClientManager
from app.repositories.resource_repository import ResourceRepository
from app.security.auth import CurrentUser
from app.security.permissions import Permission
from app.services._transaction_service import InventoryTransactionService
from app.services.inventory_service import InventoryService
from app.utils.pagination import normalize_pagination

router = APIRouter(prefix="/inventory", tags=["Inventory"])


def get_service(manager: SupabaseClientManager) -> InventoryService:
    client = manager.get_admin()
    return InventoryService(ResourceRepository(client, "inventory", ()), InventoryTransactionService(client))


@router.get("")
def list_inventory(user: CurrentUser = Depends(permission_dependency(Permission.INVENTORY_READ)), manager: SupabaseClientManager = Depends(get_supabase_manager_dependency), product_id: UUID | None = Query(None), warehouse_id: UUID | None = Query(None), location_id: UUID | None = Query(None), page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100)):
    s=get_settings(); p=normalize_pagination(page,page_size,max_page_size=s.max_page_size,default_page_size=s.default_page_size)
    rows,total=get_service(manager).list_inventory(pagination=p,filters={"product_id":product_id,"warehouse_id":warehouse_id,"location_id":location_id})
    return paginated_response(rows,page=p.page,page_size=p.page_size,total=total)

@router.get("/summary")
def inventory_summary(user: CurrentUser = Depends(permission_dependency(Permission.INVENTORY_READ)), manager: SupabaseClientManager = Depends(get_supabase_manager_dependency), product_id: UUID | None = Query(None)):
    return success_response(data=get_service(manager).product_summary(product_id))

@router.get("/{inventory_id}")
def get_inventory(inventory_id: UUID, user: CurrentUser = Depends(permission_dependency(Permission.INVENTORY_READ)), manager: SupabaseClientManager = Depends(get_supabase_manager_dependency)):
    return success_response(data=get_service(manager).get_inventory(inventory_id))

@router.post("/transactions/{operation}")
def inventory_transaction(operation: str, user: CurrentUser = Depends(permission_dependency(Permission.INVENTORY_READ)), manager: SupabaseClientManager = Depends(get_supabase_manager_dependency), payload: dict[str, Any] = Body(...)):
    # Write permission is enforced explicitly because operation names are dynamic.
    write_map={"receive_stock":Permission.RECEIPTS_WRITE,"deliver_stock":Permission.DELIVERIES_WRITE,"transfer_stock":Permission.TRANSFERS_WRITE,"adjust_stock":Permission.ADJUSTMENTS_WRITE}
    from app.security.auth import require_permission
    if operation not in write_map: from app.core.exceptions import ConflictError; raise ConflictError("Unsupported inventory operation")
    require_permission(user, write_map[operation])
    return success_response(data=get_service(manager).transact(operation,payload,user.id),message="Inventory transaction completed.")

'@
    'backend\fastapi\app\api\v1\receipts.py' = @'
from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="receipts", prefix="/receipts", read_permission="receipts.read", write_permission="receipts.write", search_columns=('reference', 'status'))

'@
    'backend\fastapi\app\api\v1\profile.py' = @'
from fastapi import APIRouter, Depends
from app.core.responses import success_response
from app.dependencies import get_current_user
from app.security.auth import CurrentUser
router=APIRouter(prefix="/profile", tags=["Profile"])
@router.get("")
def get_profile(user: CurrentUser = Depends(get_current_user)):
    return success_response(data={"id":user.id,"email":user.email,"role":user.role.value,"warehouse_id":user.warehouse_id,"permissions":sorted(user.permissions)})

'@
    'backend\fastapi\app\api\v1\resource_routes.py' = @'
from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Query, status

from app.config import get_settings
from app.core.responses import paginated_response, success_response
from app.dependencies import get_supabase_manager_dependency, permission_dependency
from app.integrations.supabase_client import SupabaseClientManager
from app.repositories.resource_repository import ResourceRepository
from app.security.auth import CurrentUser
from app.services.resource_service import ResourceService
from app.utils.pagination import normalize_pagination


def build_resource_router(*, table: str, prefix: str, read_permission: str, write_permission: str, search_columns: tuple[str, ...] = ()) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[prefix.strip("/").replace("-", " ").title()])

    def service(manager: SupabaseClientManager) -> ResourceService:
        return ResourceService(ResourceRepository(manager.get_admin(), table, search_columns))

    @router.get("")
    def list_resource(user: CurrentUser = Depends(permission_dependency(read_permission)), manager: SupabaseClientManager = Depends(get_supabase_manager_dependency), search: str | None = Query(None, max_length=100), page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100)):
        s = get_settings(); p = normalize_pagination(page, page_size, max_page_size=s.max_page_size, default_page_size=s.default_page_size)
        rows, total = service(manager).list(pagination=p, search=search)
        return paginated_response(rows, page=p.page, page_size=p.page_size, total=total)

    @router.get("/{item_id}")
    def get_resource(item_id: UUID, user: CurrentUser = Depends(permission_dependency(read_permission)), manager: SupabaseClientManager = Depends(get_supabase_manager_dependency)):
        return success_response(data=service(manager).get(str(item_id)))

    @router.post("", status_code=status.HTTP_201_CREATED)
    def create_resource(user: CurrentUser = Depends(permission_dependency(write_permission)), manager: SupabaseClientManager = Depends(get_supabase_manager_dependency), payload: dict[str, Any] = Body(...)):
        payload = dict(payload); payload.pop("id", None); payload.pop("created_at", None); payload.pop("updated_at", None)
        payload.setdefault("created_by", user.id)
        return success_response(data=service(manager).create(payload), message="Created successfully.")

    @router.patch("/{item_id}")
    def update_resource(item_id: UUID, user: CurrentUser = Depends(permission_dependency(write_permission)), manager: SupabaseClientManager = Depends(get_supabase_manager_dependency), payload: dict[str, Any] = Body(...)):
        payload = dict(payload); payload.pop("id", None); payload.pop("created_at", None); payload.pop("created_by", None)
        return success_response(data=service(manager).update(str(item_id), payload), message="Updated successfully.")

    @router.delete("/{item_id}")
    def delete_resource(item_id: UUID, user: CurrentUser = Depends(permission_dependency(write_permission)), manager: SupabaseClientManager = Depends(get_supabase_manager_dependency)):
        service(manager).delete(str(item_id)); return success_response(message="Deleted successfully.")

    return router

'@
    'supabase\migrations\20260926000100_initial_schema.sql' = @'
extension if not exists pgcrypto;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('admin','manager','staff')),
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  address text,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role_id uuid references public.roles(id),
  warehouse_id uuid references public.warehouses(id),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  unit text not null default 'pcs',
  unit_cost numeric(14,2) not null default 0 check (unit_cost >= 0),
  reorder_level numeric(14,3) not null default 0 check (reorder_level >= 0),
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (warehouse_id, code)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  address text,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  quantity numeric(14,3) not null default 0,
  reserved_quantity numeric(14,3) not null default 0 check (reserved_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, warehouse_id, location_id),
  check (quantity >= 0)
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  supplier_id uuid references public.suppliers(id) on delete set null,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  status text not null default 'draft',
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts(id) on delete cascade,
  product_id uuid not null references public.products(id),
  location_id uuid references public.locations(id),
  quantity numeric(14,3) not null check (quantity > 0),
  unit_cost numeric(14,2) not null default 0 check (unit_cost >= 0)
);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  status text not null default 'draft',
  recipient_name text,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_items (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  product_id uuid not null references public.products(id),
  location_id uuid references public.locations(id),
  quantity numeric(14,3) not null check (quantity > 0)
);

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  source_warehouse_id uuid references public.warehouses(id),
  destination_warehouse_id uuid references public.warehouses(id),
  status text not null default 'draft',
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transfer_items (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references public.transfers(id) on delete cascade,
  product_id uuid not null references public.products(id),
  source_location_id uuid references public.locations(id),
  destination_location_id uuid references public.locations(id),
  quantity numeric(14,3) not null check (quantity > 0)
);

create table if not exists public.adjustments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  product_id uuid references public.products(id),
  warehouse_id uuid references public.warehouses(id),
  location_id uuid references public.locations(id),
  quantity_delta numeric(14,3) not null,
  reason text,
  status text not null default 'posted',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ledger (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  warehouse_id uuid references public.warehouses(id),
  location_id uuid references public.locations(id),
  movement_type text not null,
  quantity_delta numeric(14,3) not null,
  balance_after numeric(14,3) not null default 0,
  reference_type text,
  reference_id uuid,
  actor_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  message text,
  product_id uuid references public.products(id) on delete cascade,
  warehouse_id uuid references public.warehouses(id) on delete cascade,
  is_read boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_product on public.inventory(product_id);
create index if not exists idx_inventory_warehouse on public.inventory(warehouse_id);
create index if not exists idx_inventory_location on public.inventory(location_id);
create index if not exists idx_ledger_product_created on public.ledger(product_id, created_at desc);
create index if not exists idx_alerts_unread on public.alerts(is_read, created_at desc);

insert into public.roles(name) values ('admin'),('manager'),('staff') on conflict (name) do nothing;

insert into public.permissions(code) values
('dashboard.read'),('products.read'),('products.write'),('categories.read'),('categories.write'),
('inventory.read'),('receipts.read'),('receipts.write'),('deliveries.read'),('deliveries.write'),
('transfers.read'),('transfers.write'),('adjustments.read'),('adjustments.write'),('ledger.read'),
('warehouses.read'),('warehouses.write'),('locations.read'),('locations.write'),('suppliers.read'),
('suppliers.write'),('alerts.read'),('profile.read'),('profile.write'),('settings.read'),('settings.write')
on conflict (code) do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p where r.name='admin'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.code in (
'dashboard.read','products.read','products.write','categories.read','categories.write','inventory.read',
'receipts.read','receipts.write','deliveries.read','deliveries.write','transfers.read','transfers.write',
'adjustments.read','adjustments.write','ledger.read','warehouses.read','warehouses.write','locations.read',
'locations.write','suppliers.read','suppliers.write','alerts.read','profile.read','profile.write','settings.read','settings.write'
) where r.name='manager' on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.code in (
'dashboard.read','products.read','categories.read','inventory.read','receipts.read','receipts.write',
'deliveries.read','deliveries.write','transfers.read','transfers.write','adjustments.read','ledger.read',
'warehouses.read','locations.read','suppliers.read','alerts.read','profile.read','profile.write'
) where r.name='staff' on conflict do nothing;

create or replace function public.receive_stock(p_payload jsonb, p_actor_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_product uuid := (p_payload->>'product_id')::uuid; v_warehouse uuid := (p_payload->>'warehouse_id')::uuid; v_location uuid := (p_payload->>'location_id')::uuid; v_qty numeric := (p_payload->>'quantity')::numeric; v_row inventory%rowtype;
begin
 if v_qty is null or v_qty <= 0 then raise exception 'quantity must be greater than zero'; end if;
 insert into inventory(product_id,warehouse_id,location_id,quantity) values(v_product,v_warehouse,v_location,v_qty)
 on conflict(product_id,warehouse_id,location_id) do update set quantity=inventory.quantity+excluded.quantity,updated_at=now()
 returning * into v_row;
 insert into ledger(product_id,warehouse_id,location_id,movement_type,quantity_delta,balance_after,reference_type,reference_id,actor_id,metadata)
 values(v_product,v_warehouse,v_location,'receive',v_qty,v_row.quantity,p_payload->>'reference_type',null,p_actor_id,p_payload);
 return jsonb_build_object('inventory_id',v_row.id,'quantity',v_row.quantity,'operation','receive');
end $$;

create or replace function public.deliver_stock(p_payload jsonb, p_actor_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_product uuid := (p_payload->>'product_id')::uuid; v_warehouse uuid := (p_payload->>'warehouse_id')::uuid; v_location uuid := (p_payload->>'location_id')::uuid; v_qty numeric := (p_payload->>'quantity')::numeric; v_row inventory%rowtype; v_new numeric;
begin
 if v_qty is null or v_qty <= 0 then raise exception 'quantity must be greater than zero'; end if;
 select * into v_row from inventory where product_id=v_product and warehouse_id=v_warehouse and location_id=v_location for update;
 if not found then raise exception 'inventory row not found'; end if;
 v_new := v_row.quantity-v_qty;
 if v_new < 0 then raise exception 'insufficient stock'; end if;
 update inventory set quantity=v_new,updated_at=now() where id=v_row.id returning * into v_row;
 insert into ledger(product_id,warehouse_id,location_id,movement_type,quantity_delta,balance_after,reference_type,reference_id,actor_id,metadata)
 values(v_product,v_warehouse,v_location,'delivery',-v_qty,v_row.quantity,p_payload->>'reference_type',null,p_actor_id,p_payload);
 return jsonb_build_object('inventory_id',v_row.id,'quantity',v_row.quantity,'operation','deliver');
end $$;

create or replace function public.adjust_stock(p_payload jsonb, p_actor_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_product uuid := (p_payload->>'product_id')::uuid; v_warehouse uuid := (p_payload->>'warehouse_id')::uuid; v_location uuid := (p_payload->>'location_id')::uuid; v_delta numeric := (p_payload->>'quantity_delta')::numeric; v_row inventory%rowtype; v_new numeric;
begin
 if v_delta is null then raise exception 'quantity_delta is required'; end if;
 insert into inventory(product_id,warehouse_id,location_id,quantity) values(v_product,v_warehouse,v_location,greatest(v_delta,0))
 on conflict(product_id,warehouse_id,location_id) do nothing;
 select * into v_row from inventory where product_id=v_product and warehouse_id=v_warehouse and location_id=v_location for update;
 v_new:=v_row.quantity+v_delta; if v_new<0 then raise exception 'adjustment would make stock negative'; end if;
 update inventory set quantity=v_new,updated_at=now() where id=v_row.id returning * into v_row;
 insert into ledger(product_id,warehouse_id,location_id,movement_type,quantity_delta,balance_after,actor_id,metadata)
 values(v_product,v_warehouse,v_location,'adjustment',v_delta,v_row.quantity,p_actor_id,p_payload);
 return jsonb_build_object('inventory_id',v_row.id,'quantity',v_row.quantity,'operation','adjust');
end $$;

create or replace function public.transfer_stock(p_payload jsonb, p_actor_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_product uuid := (p_payload->>'product_id')::uuid; v_source_wh uuid := (p_payload->>'source_warehouse_id')::uuid; v_dest_wh uuid := (p_payload->>'destination_warehouse_id')::uuid; v_source_loc uuid := (p_payload->>'source_location_id')::uuid; v_dest_loc uuid := (p_payload->>'destination_location_id')::uuid; v_qty numeric := (p_payload->>'quantity')::numeric; v_src inventory%rowtype; v_dst inventory%rowtype; v_new numeric;
begin
 if v_qty is null or v_qty<=0 then raise exception 'quantity must be greater than zero'; end if;
 select * into v_src from inventory where product_id=v_product and warehouse_id=v_source_wh and location_id=v_source_loc for update;
 if not found or v_src.quantity<v_qty then raise exception 'insufficient source stock'; end if;
 update inventory set quantity=quantity-v_qty,updated_at=now() where id=v_src.id returning * into v_src;
 insert into inventory(product_id,warehouse_id,location_id,quantity) values(v_product,v_dest_wh,v_dest_loc,v_qty)
 on conflict(product_id,warehouse_id,location_id) do update set quantity=inventory.quantity+excluded.quantity,updated_at=now()
 returning * into v_dst;
 insert into ledger(product_id,warehouse_id,location_id,movement_type,quantity_delta,balance_after,actor_id,metadata) values(v_product,v_source_wh,v_source_loc,'transfer_out',-v_qty,v_src.quantity,p_actor_id,p_payload);
 insert into ledger(product_id,warehouse_id,location_id,movement_type,quantity_delta,balance_after,actor_id,metadata) values(v_product,v_dest_wh,v_dest_loc,'transfer_in',v_qty,v_dst.quantity,p_actor_id,p_payload);
 return jsonb_build_object('source_inventory_id',v_src.id,'destination_inventory_id',v_dst.id,'source_quantity',v_src.quantity,'destination_quantity',v_dst.quantity,'operation','transfer');
end $$;

'@
}

foreach ($item in $files.GetEnumerator()) {
    $target = Join-Path $root $item.Key
    $dir = Split-Path -Parent $target
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    [System.IO.File]::WriteAllText($target, $item.Value.TrimStart("`r","`n"), (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "Wrote $($item.Key)"
}
Write-Host "Replacement complete." -ForegroundColor Green
