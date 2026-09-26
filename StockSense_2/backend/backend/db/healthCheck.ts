import pool from './connection'

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()')
    console.log('Database Connection OK! Current Time:', res.rows[0].now)
    process.exit(0)
  } catch (err) {
    console.error('Database Connection Failed:', err)
    process.exit(1)
  }
}

testConnection()