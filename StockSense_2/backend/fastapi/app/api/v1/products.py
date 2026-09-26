from app.api.v1.resource_routes import build_resource_router
router = build_resource_router(table="products", prefix="/products", read_permission="products.read", write_permission="products.write", search_columns=('name', 'sku'))
