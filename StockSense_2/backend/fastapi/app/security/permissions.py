from __future__ import annotations

from enum import StrEnum


class Permission(StrEnum):
    DASHBOARD_READ = "dashboard.read"

    PRODUCTS_READ = "products.read"
    PRODUCTS_WRITE = "products.write"

    CATEGORIES_READ = "categories.read"
    CATEGORIES_WRITE = "categories.write"

    INVENTORY_READ = "inventory.read"

    RECEIPTS_READ = "receipts.read"
    RECEIPTS_WRITE = "receipts.write"

    DELIVERIES_READ = "deliveries.read"
    DELIVERIES_WRITE = "deliveries.write"

    TRANSFERS_READ = "transfers.read"
    TRANSFERS_WRITE = "transfers.write"

    ADJUSTMENTS_READ = "adjustments.read"
    ADJUSTMENTS_WRITE = "adjustments.write"

    LEDGER_READ = "ledger.read"

    WAREHOUSES_READ = "warehouses.read"
    WAREHOUSES_WRITE = "warehouses.write"

    LOCATIONS_READ = "locations.read"
    LOCATIONS_WRITE = "locations.write"

    SUPPLIERS_READ = "suppliers.read"
    SUPPLIERS_WRITE = "suppliers.write"

    ALERTS_READ = "alerts.read"

    PROFILE_READ = "profile.read"
    PROFILE_WRITE = "profile.write"

    SETTINGS_READ = "settings.read"
    SETTINGS_WRITE = "settings.write"


def permission_allowed(
    granted: set[str],
    required: str,
) -> bool:
    return "*" in granted or required in granted