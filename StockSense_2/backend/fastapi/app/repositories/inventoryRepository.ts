import { query } from '../db/connection'
import { STOCK_STATUSES } from '@/shared/constants'

export const inventoryRepository = {
  // Fetch all inventory items
  async getAllItems() {
    const result = await query('SELECT * FROM inventory_items ORDER BY created_at DESC')
    return result.rows
  },

  // Fetch low stock items dynamically
  async getLowStockItems() {
    const result = await query(
      'SELECT * FROM inventory_items WHERE status = $1 OR quantity <= reorder_level',
      [STOCK_STATUSES.LOW_STOCK]
    )
    return result.rows
  },

  // Add a new stock item
  async createItem(name: string, sku: string, categoryId: number, quantity: number, reorderLevel: number) {
    const queryText = `
      INSERT INTO inventory_items (name, sku, category_id, quantity, reorder_level, status)
      VALUES ($1, $2, $3, $4, $5, CASE WHEN $4 <= $5 THEN 'low_stock' ELSE 'in_stock' END)
      RETURNING *;
    `
    const values = [name, sku, categoryId, quantity, reorderLevel]
    const result = await query(queryText, values)
    return result.rows[0]
  }
}