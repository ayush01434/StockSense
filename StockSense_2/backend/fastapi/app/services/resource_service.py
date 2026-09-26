from __future__ import annotations

from typing import Any
from app.repositories.resource_repository import ResourceRepository
from app.utils.pagination import Pagination


class ResourceService:
    def __init__(self, repository: ResourceRepository) -> None:
        self.repository = repository

    def list(self, **kwargs: Any): return self.repository.list(**kwargs)
    def get(self, identifier: str): return self.repository.get(identifier)
    def create(self, payload: dict[str, Any]): return self.repository.create(payload)
    def update(self, identifier: str, payload: dict[str, Any]): return self.repository.update(identifier, payload)
    def delete(self, identifier: str): return self.repository.delete(identifier)
