from fastapi import APIRouter
from app.api.v1 import adjustments, alerts, categories, dashboard, deliveries, inventory, ledger, locations, products, profile, receipts, suppliers, transfers, warehouses
api_router=APIRouter()
for _module in (dashboard,products,categories,inventory,receipts,deliveries,transfers,adjustments,ledger,warehouses,locations,suppliers,alerts,profile):
    api_router.include_router(_module.router)
