from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="suppliers", prefix="/suppliers", read_permission="suppliers.read", write_permission="suppliers.write", search_columns=('name', 'email'))
