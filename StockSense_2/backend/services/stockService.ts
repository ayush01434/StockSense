import pool from '../db/connection'

export const stockService = {
  async transferStock(itemId: number, sourceWarehouseId: number, destWarehouseId: number, quantity: number, userId: number) {
    const client = await pool.connect()
    
    try {
      // Start transaction
      await client.query('BEGIN')

      // 1. Check stock availability in source
      const checkStockQuery = 'SELECT quantity FROM warehouse_inventory WHERE item_id = $1 AND warehouse_id = $2'
      const stockResult = await client.query(checkStockQuery, [itemId, sourceWarehouseId])

      if (stockResult.rows.length === 0 || stockResult.rows[0].quantity < quantity) {
        throw new Error('Insufficient stock in source warehouse!')
      }

      // 2. Deduct from source warehouse
      const deductQuery = 'UPDATE warehouse_inventory SET quantity = quantity - $1 WHERE item_id = $2 AND warehouse_id = $3'
      await client.query(deductQuery, [quantity, itemId, sourceWarehouseId])

      // 3. Add to destination warehouse (or insert if not exists)
      const addQuery = `
        INSERT INTO warehouse_inventory (warehouse_id, item_id, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (warehouse_id, item_id) 
        DO UPDATE SET quantity = warehouse_inventory.quantity + $3
      `
      await client.query(addQuery, [destWarehouseId, itemId, quantity])

      // 4. Log into stock_movements ledger audit table
      const logQuery = `
        INSERT INTO stock_movements (item_id, user_id, movement_type, quantity, reference_note)
        VALUES ($1, $2, 'transfer', $3, $4)
      `
      await client.query(logQuery, [itemId, userId, quantity, `Transferred from WH ${sourceWarehouseId} to WH ${destWarehouseId}`])

      // Commit transaction if all steps succeed
      await client.query('COMMIT')
      return { success: true, message: 'Stock transferred successfully with ACID compliance!' }

    } catch (error: any) {
      // Rollback changes if any error occurs
      await client.query('ROLLBACK')
      throw new Error(`Stock transfer failed: ${error.message}`)
    } finally {
      client.release()
    }
  }
}