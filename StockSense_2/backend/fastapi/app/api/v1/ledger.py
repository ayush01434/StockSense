from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="ledger", prefix="/ledger", read_permission="ledger.read", write_permission="ledger.read", search_columns=('reference', 'movement_type'))
