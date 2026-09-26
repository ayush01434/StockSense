from __future__ import annotations

import logging
from typing import Any

from supabase import Client

from app.core.exceptions import (
    ConflictError,
    NotFoundError,
    ServiceUnavailableError,
)
from app.utils.filters import search_pattern
from app.utils.pagination import Pagination

logger = logging.getLogger(__name__)


class BaseRepository:
    table_name: str = ""

    def __init__(
        self,
        client: Client,
    ) -> None:

        if not self.table_name:
            raise ValueError(
                "Repository table_name is required."
            )

        self.client = client

    def list(
        self,
        *,
        pagination: Pagination,
        filters: dict[str, Any] | None = None,
        search_column: str | None = None,
        search: str | None = None,
        order_by: str = "created_at",
        ascending: bool = False,
        select: str = "*",
    ) -> tuple[
        list[dict[str, Any]],
        int,
    ]:

        try:
            query = (
                self.client
                .table(self.table_name)
                .select(
                    select,
                    count="exact",
                )
            )

            for key, value in (
                filters or {}
            ).items():

                if value is None:
                    continue

                if hasattr(
                    value,
                    "hex",
                ):
                    value = str(value)

                query = query.eq(
                    key,
                    value,
                )

            pattern = search_pattern(
                search
            )

            if (
                search_column
                and pattern
            ):
                query = query.ilike(
                    search_column,
                    pattern,
                )

            query = query.order(
                order_by,
                desc=not ascending,
            )

            response = (
                query
                .range(
                    pagination.offset,
                    pagination.end,
                )
                .execute()
            )

            return (
                response.data or [],
                int(
                    getattr(
                        response,
                        "count",
                        None,
                    )
                    or 0
                ),
            )

        except Exception as exc:
            logger.exception(
                "List failed for %s",
                self.table_name,
            )

            raise ServiceUnavailableError(
                f"Unable to query {self.table_name}."
            ) from exc

    def get(
        self,
        identifier: str,
        *,
        select: str = "*",
    ) -> dict[str, Any]:

        try:
            response = (
                self.client
                .table(self.table_name)
                .select(select)
                .eq("id", identifier)
                .maybe_single()
                .execute()
            )

            data = response.data

            if not data:
                raise NotFoundError(
                    self.table_name,
                    identifier,
                )

            return data

        except NotFoundError:
            raise

        except Exception as exc:
            raise ServiceUnavailableError(
                f"Unable to query {self.table_name}."
            ) from exc

    def create(
        self,
        payload: dict[str, Any],
        *,
        select: str = "*",
    ) -> dict[str, Any]:

        try:
            response = (
                self.client
                .table(self.table_name)
                .insert(payload)
                .select(select)
                .single()
                .execute()
            )

            if not response.data:
                raise ServiceUnavailableError(
                    f"Insert succeeded but {self.table_name} returned no data."
                )

            return response.data

        except Exception as exc:
            message = str(exc).lower()

            if (
                "duplicate" in message
                or "unique" in message
            ):
                raise ConflictError(
                    f"Duplicate value in {self.table_name}."
                ) from exc

            if isinstance(
                exc,
                ServiceUnavailableError,
            ):
                raise

            raise ServiceUnavailableError(
                f"Unable to create {self.table_name}."
            ) from exc

    def update(
        self,
        identifier: str,
        payload: dict[str, Any],
        *,
        select: str = "*",
    ) -> dict[str, Any]:

        try:
            response = (
                self.client
                .table(self.table_name)
                .update(payload)
                .eq("id", identifier)
                .select(select)
                .maybe_single()
                .execute()
            )

            if not response.data:
                raise NotFoundError(
                    self.table_name,
                    identifier,
                )

            return response.data

        except NotFoundError:
            raise

        except Exception as exc:
            raise ServiceUnavailableError(
                f"Unable to update {self.table_name}."
            ) from exc

    def delete(
        self,
        identifier: str,
    ) -> None:

        try:
            response = (
                self.client
                .table(self.table_name)
                .delete()
                .eq("id", identifier)
                .execute()
            )

            if not response.data:
                raise NotFoundError(
                    self.table_name,
                    identifier,
                )

        except NotFoundError:
            raise

        except Exception as exc:
            raise ServiceUnavailableError(
                f"Unable to delete {self.table_name}."
            ) from exc