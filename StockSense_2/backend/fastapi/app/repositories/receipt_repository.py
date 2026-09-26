from supabase import Client
from app.repositories.resource_repository import ResourceRepository

class ReceiptRepository(ResourceRepository):
    def __init__(self, client: Client):
        super().__init__(client, "receipts")
