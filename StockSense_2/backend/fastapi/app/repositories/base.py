from __future__ import annotations

import logging
from typing import Any

from supabase import Client

from app.core.exceptions import ConflictError, NotFoundError, ServiceUnavailableError
from app.utils.filters import search_pattern
from app.utils.pagination import Pagination

logger = logging.getLogger(__name__)


class BaseRepository:
    table_name: str = ""
    search_columns: tuple[str, ...] = ()

    def __init__(self, client: Client) -> None:
        if not self.table_name:
            raise ValueError("Repository table_name is required")
        self.client = client

    @staticmethod
    def _clean(value: Any) -> Any:
        if hasattr(value, "hex"):
            return str(value)
        return value

    def list(self, *, pagination: Pagination, filters: dict[str, Any] | None = None, search: str | None = None, order_by: str = "created_at", ascending: bool = False, select: str = "*") -> tuple[list[dict[str, Any]], int]:
        try:
            query = self.client.table(self.table_name).select(select, count="exact")
            for key, value in (filters or {}).items():
                if value is not None:
                    query = query.eq(key, self._clean(value))
            pattern = search_pattern(search)
            if pattern and self.search_columns:
                # PostgREST OR syntax: col.ilike.pattern,col2.ilike.pattern
                clauses = ",".join(f"{col}.ilike.{pattern}" for col in self.search_columns)
                query = query.or_(clauses)
            query = query.order(order_by, desc=not ascending)
            response = query.range(pagination.offset, pagination.end).execute()
            return response.data or [], int(getattr(response, "count", 0) or 0)
        except Exception as exc:
            logger.exception("List failed for %s", self.table_name)
            raise ServiceUnavailableError(f"Unable to query {self.table_name}.") from exc

    def get(self, identifier: str, *, select: str = "*") -> dict[str, Any]:
        try:
            response = self.client.table(self.table_name).select(select).eq("id", identifier).maybe_single().execute()
            if not response.data:
                raise NotFoundError(self.table_name, identifier)
            return response.data
        except NotFoundError:
            raise
        except Exception as exc:
            raise ServiceUnavailableError(f"Unable to query {self.table_name}.") from exc

    def create(self, payload: dict[str, Any], *, select: str = "*") -> dict[str, Any]:
        try:
            response = self.client.table(self.table_name).insert(payload).select(select).single().execute()
            if not response.data:
                raise ServiceUnavailableError(f"Insert returned no {self.table_name} row.")
            return response.data
        except Exception as exc:
            msg = str(exc).lower()
            if "duplicate" in msg or "unique" in msg:
                raise ConflictError(f"Duplicate value in {self.table_name}.") from exc
            raise ServiceUnavailableError(f"Unable to create {self.table_name}.") from exc

    def update(self, identifier: str, payload: dict[str, Any], *, select: str = "*") -> dict[str, Any]:
        try:
            response = self.client.table(self.table_name).update(payload).eq("id", identifier).select(select).maybe_single().execute()
            if not response.data:
                raise NotFoundError(self.table_name, identifier)
            return response.data
        except NotFoundError:
            raise
        except Exception as exc:
            raise ServiceUnavailableError(f"Unable to update {self.table_name}.") from exc

    def delete(self, identifier: str) -> None:
        try:
            response = self.client.table(self.table_name).delete().eq("id", identifier).execute()
            if not response.data:
                raise NotFoundError(self.table_name, identifier)
        except NotFoundError:
            raise
        except Exception as exc:
            raise ServiceUnavailableError(f"Unable to delete {self.table_name}.") from exc
