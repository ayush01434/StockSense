from fastapi import APIRouter

from app.api.v1 import (
    adjustments,
    alerts,
    categories,
    dashboard,
    deliveries,
    inventory,
    ledger,
    locations,
    products,
    profile,
    receipts,
    suppliers,
    transfers,
    warehouses,
)

api_router = APIRouter()


api_router.include_router(
    dashboard.router,
    prefix="/dashboard",
)

api_router.include_router(
    products.router,
    prefix="/products",
)

api_router.include_router(
    categories.router,
    prefix="/categories",
)

api_router.include_router(
    inventory.router,
)

api_router.include_router(
    receipts.router,
    prefix="/receipts",
)

api_router.include_router(
    deliveries.router,
    prefix="/deliveries",
)

api_router.include_router(
    transfers.router,
    prefix="/transfers",
)

api_router.include_router(
    adjustments.router,
    prefix="/adjustments",
)

api_router.include_router(
    ledger.router,
    prefix="/ledger",
)

api_router.include_router(
    warehouses.router,
    prefix="/warehouses",
)

api_router.include_router(
    locations.router,
    prefix="/locations",
)

api_router.include_router(
    suppliers.router,
    prefix="/suppliers",
)

api_router.include_router(
    alerts.router,
    prefix="/alerts",
)

api_router.include_router(
    profile.router,
    prefix="/profile",
)