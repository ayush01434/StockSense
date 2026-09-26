from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="adjustments", prefix="/adjustments", read_permission="adjustments.read", write_permission="adjustments.write", search_columns=('reference', 'status'))
