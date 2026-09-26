from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="alerts", prefix="/alerts", read_permission="alerts.read", write_permission="alerts.read", search_columns=('title', 'type'))
