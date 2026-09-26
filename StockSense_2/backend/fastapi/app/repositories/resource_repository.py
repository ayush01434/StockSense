from __future__ import annotations

from supabase import Client
from app.repositories.base import BaseRepository


class ResourceRepository(BaseRepository):
    def __init__(self, client: Client, table_name: str, search_columns: tuple[str, ...] = ()) -> None:
        self.table_name = table_name
        self.search_columns = search_columns
        super().__init__(client)
