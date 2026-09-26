from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="locations", prefix="/locations", read_permission="locations.read", write_permission="locations.write", search_columns=('name', 'code'))
