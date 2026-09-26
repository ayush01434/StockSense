from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="transfers", prefix="/transfers", read_permission="transfers.read", write_permission="transfers.write", search_columns=('reference', 'status'))
