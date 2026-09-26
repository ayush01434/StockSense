import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// Database connection pool setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/stocksense_db",
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('connect', () => {
  console.log('Connected to the StockSense PostgreSQL database successfully!')
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err)
  process.exit(-1)
})

export const query = (text: string, params?: any[]) => pool.query(text, params)
export default pool