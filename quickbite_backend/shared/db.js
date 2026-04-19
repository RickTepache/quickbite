/**
 * db.js — Pool de conexión PostgreSQL compartido
 * Cada microservicio importa este módulo
 */
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                  // máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message)
})

// Helper: ejecutar query con manejo de errores
const query = (text, params) => pool.query(text, params)

// Helper: obtener cliente para transacciones
const getClient = () => pool.connect()

module.exports = { pool, query, getClient }
