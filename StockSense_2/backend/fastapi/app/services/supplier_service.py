from typing import Any
from app.repositories.supplier_repository import SupplierRepository

class SupplierService:
    def __init__(self, repository: SupplierRepository): self.repository=repository
    def list(self, **kwargs: Any): return self.repository.list(**kwargs)
    def get(self, identifier: str): return self.repository.get(identifier)
    def create(self, payload: dict[str, Any]): return self.repository.create(payload)
    def update(self, identifier: str, payload: dict[str, Any]): return self.repository.update(identifier,payload)
    def delete(self, identifier: str): return self.repository.delete(identifier)
