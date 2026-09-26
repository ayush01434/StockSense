CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_movements_item_id ON stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON stock_movements(created_at);