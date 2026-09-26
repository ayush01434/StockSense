from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="deliveries", prefix="/deliveries", read_permission="deliveries.read", write_permission="deliveries.write", search_columns=('reference', 'status'))
