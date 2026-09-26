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
