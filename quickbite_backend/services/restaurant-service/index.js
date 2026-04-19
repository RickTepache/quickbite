/**
 * Restaurant Service — Puerto 4002
 * Responsabilidades: listar, crear, actualizar, eliminar restaurantes
 */
require('dotenv').config({ path: '../../.env' })
const express = require('express')
const cors    = require('cors')
const jwt     = require('jsonwebtoken')
const { Pool } = require('pg')

const app  = express()
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const PORT = process.env.RESTAURANT_PORT || 4002

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

// ── Auth middleware local ─────────────────────────────────────
const auth = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Token requerido' })
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Token inválido' })
  }
}

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role))
    return res.status(403).json({ success: false, message: 'Sin permiso' })
  next()
}

// ── GET /restaurants — listar todos (con filtro opcional por categoría) ──
app.get('/restaurants', async (req, res) => {
  try {
    const { category } = req.query
    let queryText = 'SELECT * FROM restaurants WHERE active = TRUE'
    const params = []

    if (category) {
      params.push(category)
      queryText += ` AND LOWER(category) = LOWER($${params.length})`
    }

    queryText += ' ORDER BY rating DESC'
    const result = await pool.query(queryText, params)
    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('GET /restaurants error:', err.message)
    res.status(500).json({ success: false, message: 'Error al obtener restaurantes' })
  }
})

// ── GET /restaurants/:id — detalle de un restaurante ────────
app.get('/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (isNaN(id))
      return res.status(400).json({ success: false, message: 'ID inválido' })

    const result = await pool.query(
      'SELECT * FROM restaurants WHERE id = $1 AND active = TRUE', [id]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Restaurante no encontrado' })

    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener restaurante' })
  }
})

// ── POST /restaurants — crear restaurante (solo admin) ───────
app.post('/restaurants', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, category, address, hours, image, delivery_time, pickup_time, min_order } = req.body

    if (!name?.trim() || !category?.trim())
      return res.status(400).json({ success: false, message: 'Nombre y categoría son obligatorios' })
    if (name.trim().length > 80)
      return res.status(400).json({ success: false, message: 'Nombre demasiado largo' })
    if (/<[^>]*>|javascript:/i.test(name))
      return res.status(400).json({ success: false, message: 'Contenido no permitido' })

    const result = await pool.query(
      `INSERT INTO restaurants (name, category, address, hours, image, delivery_time, pickup_time, min_order, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name.trim(), category.trim(), address, hours, image, delivery_time || '25-35 min', pickup_time || '10-15 min', min_order || 0, req.user.id]
    )

    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error('POST /restaurants error:', err.message)
    res.status(500).json({ success: false, message: 'Error al crear restaurante' })
  }
})

// ── PUT /restaurants/:id — actualizar (admin o dueño) ────────
app.put('/restaurants/:id', auth, requireRole('admin', 'restaurant'), async (req, res) => {
  try {
    const { id } = req.params
    if (isNaN(id))
      return res.status(400).json({ success: false, message: 'ID inválido' })

    const existing = await pool.query('SELECT * FROM restaurants WHERE id = $1', [id])
    if (existing.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Restaurante no encontrado' })

    // El dueño solo puede editar su propio restaurante
    if (req.user.role === 'restaurant' && existing.rows[0].owner_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'No puedes editar este restaurante' })

    const { name, category, address, hours, image, delivery_time, pickup_time, min_order, active } = req.body
    const result = await pool.query(
      `UPDATE restaurants SET
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        address = COALESCE($3, address),
        hours = COALESCE($4, hours),
        image = COALESCE($5, image),
        delivery_time = COALESCE($6, delivery_time),
        pickup_time = COALESCE($7, pickup_time),
        min_order = COALESCE($8, min_order),
        active = COALESCE($9, active)
       WHERE id = $10 RETURNING *`,
      [name, category, address, hours, image, delivery_time, pickup_time, min_order, active, id]
    )

    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error('PUT /restaurants error:', err.message)
    res.status(500).json({ success: false, message: 'Error al actualizar restaurante' })
  }
})

// ── DELETE /restaurants/:id — desactivar (solo admin) ────────
app.delete('/restaurants/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params
    if (isNaN(id))
      return res.status(400).json({ success: false, message: 'ID inválido' })

    await pool.query('UPDATE restaurants SET active = FALSE WHERE id = $1', [id])
    res.json({ success: true, message: 'Restaurante desactivado correctamente' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al eliminar restaurante' })
  }
})

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ service: 'restaurant-service', status: 'ok', port: PORT }))

app.listen(PORT, () => console.log(`🍽️  Restaurant Service corriendo en puerto ${PORT}`))
