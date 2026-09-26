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
