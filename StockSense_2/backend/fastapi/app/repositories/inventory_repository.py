from supabase import Client
from app.repositories.resource_repository import ResourceRepository

class InventoryRepository(ResourceRepository):
    def __init__(self, client: Client):
        super().__init__(client, "inventory")
    def list_inventory(self, **kwargs): return self.list(**kwargs)
    def get_inventory(self, identifier: str): return self.get(identifier)
    def product_summary(self, product_id=None):
        rows, _ = self.list(pagination=type("P", (), {"offset":0,"end":9999})(), filters={"product_id": product_id})
        return rows
