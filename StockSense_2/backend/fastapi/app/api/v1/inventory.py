from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    Query,
)

from app.config import get_settings
from app.core.responses import (
    paginated_response,
    success_response,
)
from app.dependencies import (
    get_supabase_manager_dependency,
    permission_dependency,
)
from app.integrations.supabase_client import (
    SupabaseClientManager,
)
from app.repositories.inventory_repository import (
    InventoryRepository,
)
from app.schemas.inventory import (
    InventoryResponse,
    InventorySummary,
)
from app.security.auth import CurrentUser
from app.security.permissions import Permission
from app.services.inventory_service import (
    InventoryService,
)
from app.utils.pagination import (
    normalize_pagination,
)

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
)


def get_inventory_service(
    manager: SupabaseClientManager,
) -> InventoryService:

    client = manager.get_admin()

    return InventoryService(
        InventoryRepository(client)
    )


@router.get(
    "",
    response_model=dict,
)
def list_inventory(
    user: Annotated[
        CurrentUser,
        Depends(
            permission_dependency(
                Permission.INVENTORY_READ
            )
        ),
    ],
    manager: Annotated[
        SupabaseClientManager,
        Depends(
            get_supabase_manager_dependency
        ),
    ],
    product_id: UUID | None = Query(
        default=None
    ),
    warehouse_id: UUID | None = Query(
        default=None
    ),
    location_id: UUID | None = Query(
        default=None
    ),
    search: str | None = Query(
        default=None,
        max_length=100,
    ),
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
):
    settings = get_settings()

    pagination = normalize_pagination(
        page,
        page_size,
        max_page_size=settings.max_page_size,
        default_page_size=settings.default_page_size,
    )

    service = get_inventory_service(
        manager
    )

    rows, total = (
        service.list_inventory(
            pagination=pagination,
            filters={
                "product_id": product_id,
                "warehouse_id": warehouse_id,
                "location_id": location_id,
            },
            search=search,
            search_column=None,
        )
    )

    return paginated_response(
        rows,
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
    )


@router.get(
    "/summary",
    response_model=dict,
)
def inventory_summary(
    user: Annotated[
        CurrentUser,
        Depends(
            permission_dependency(
                Permission.INVENTORY_READ
            )
        ),
    ],
    manager: Annotated[
        SupabaseClientManager,
        Depends(
            get_supabase_manager_dependency
        ),
    ],
    product_id: UUID | None = Query(
        default=None
    ),
):
    service = get_inventory_service(
        manager
    )

    return success_response(
        data=service.product_summary(
            product_id
        )
    )


@router.get(
    "/{inventory_id}",
    response_model=dict,
)
def get_inventory(
    inventory_id: UUID,
    user: Annotated[
        CurrentUser,
        Depends(
            permission_dependency(
                Permission.INVENTORY_READ
            )
        ),
    ],
    manager: Annotated[
        SupabaseClientManager,
        Depends(
            get_supabase_manager_dependency
        ),
    ],
):
    service = get_inventory_service(
        manager
    )

    return success_response(
        data=service.get_inventory(
            inventory_id
        )
    )