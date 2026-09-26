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
