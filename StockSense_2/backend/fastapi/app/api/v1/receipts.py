from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="receipts", prefix="/receipts", read_permission="receipts.read", write_permission="receipts.write", search_columns=('reference', 'status'))
