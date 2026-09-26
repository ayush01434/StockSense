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
