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
