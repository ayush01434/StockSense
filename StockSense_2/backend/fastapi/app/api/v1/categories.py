from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="categories", prefix="/categories", read_permission="categories.read", write_permission="categories.write", search_columns=('name',))
