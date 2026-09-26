from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="warehouses", prefix="/warehouses", read_permission="warehouses.read", write_permission="warehouses.write", search_columns=('name', 'code'))
