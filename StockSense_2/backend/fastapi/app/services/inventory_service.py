from __future__ import annotations

from decimal import Decimal
from typing import Any
from uuid import UUID

from app.repositories.inventory_repository import (
    InventoryRepository,
)


class InventoryService:
    def __init__(
        self,
        repository: InventoryRepository,
    ) -> None:
        self.repository = repository

    def list_inventory(
        self,
        **kwargs: Any,
    ):
        return self.repository.list_inventory(
            **kwargs
        )

    def get_inventory(
        self,
        inventory_id: UUID,
    ):
        return self.repository.get_inventory(
            str(inventory_id)
        )

    def product_summary(
        self,
        product_id: UUID | None = None,
    ) -> list[dict[str, Any]]:

        rows = (
            self.repository.product_summary(
                str(product_id)
                if product_id
                else None
            )
        )

        grouped: dict[
            str,
            dict[str, Any],
        ] = {}

        for row in rows:

            product_id_value = str(
                row["product_id"]
            )

            product = (
                row.get("products")
                or {}
            )

            item = grouped.setdefault(
                product_id_value,
                {
                    "product_id":
                        product_id_value,

                    "product_name":
                        product.get("name"),

                    "sku":
                        product.get("sku"),

                    "total_quantity":
                        Decimal("0"),

                    "total_reserved":
                        Decimal("0"),
                },
            )

            item[
                "total_quantity"
            ] += Decimal(
                str(
                    row.get(
                        "quantity"
                    )
                    or 0
                )
            )

            item[
                "total_reserved"
            ] += Decimal(
                str(
                    row.get(
                        "reserved_quantity"
                    )
                    or 0
                )
            )

        for item in grouped.values():
            item[
                "total_available"
            ] = (
                item["total_quantity"]
                - item["total_reserved"]
            )

        return list(
            grouped.values()
        )