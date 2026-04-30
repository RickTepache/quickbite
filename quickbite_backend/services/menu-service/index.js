/**
 * Menu Service — Puerto 4003
 * Responsabilidades: listar, crear, actualizar y eliminar platillos del menú
 *
 * CORRECCIONES:
 *  - Bug #2: GET /menu/item/:id ahora se declara ANTES de GET /menu/:restaurantId.
 *            Antes Express capturaba /menu/item/5 como restaurantId='item' → 400.
 *            Al invertir el orden, /menu/item/:id se resuelve correctamente.
 */
require('dotenv').config({ path: '../../.env' })
const express = require('express')
const cors    = require('cors')
const jwt     = require('jsonwebtoken')
const { Pool } = require('pg')

const app  = express()
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const PORT = process.env.MENU_PORT || 4003

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

// ── Validación de platillo ────────────────────────────────────
const validateMenuItem = (body) => {
  const errors = {}
  const { name, price } = body

  if (!name?.trim() || name.trim().length < 3)
    errors.name = 'El nombre debe tener al menos 3 caracteres'
  if (name?.trim().length > 80)
    errors.name = 'El nombre es demasiado largo (máx. 80 caracteres)'
  if (/<[^>]*>|javascript:/i.test(name || ''))
    errors.name = 'El nombre contiene contenido no permitido'

  const priceNum = Number(price)
  if (!price || isNaN(priceNum) || priceNum <= 0)
    errors.price = 'El precio debe ser un número mayor a 0'
  if (priceNum > 99999)
    errors.price = 'El precio es demasiado alto'

  return errors
}

// ── GET /menu/item/:id — obtener un platillo por su ID ───────
// CORRECCIÓN Bug #2: Este endpoint va ANTES de /menu/:restaurantId.
// Si estuviera después, Express lo capturaría como restaurantId='item'.
app.get('/menu/item/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (isNaN(id))
      return res.status(400).json({ success: false, message: 'ID inválido' })

    const result = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id])
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Platillo no encontrado' })

    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener platillo' })
  }
})

// ── GET /menu/:restaurantId — obtener menú de un restaurante ─
app.get('/menu/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params
    if (isNaN(restaurantId))
      return res.status(400).json({ success: false, message: 'ID de restaurante inválido' })

    const result = await pool.query(
      'SELECT * FROM menu_items WHERE restaurant_id = $1 AND available = TRUE ORDER BY popular DESC, name ASC',
      [restaurantId]
    )
    res.json({ success: true, data: result.rows })
  } catch (err) {
    console.error('GET /menu error:', err.message)
    res.status(500).json({ success: false, message: 'Error al obtener el menú' })
  }
})

// ── POST /menu — crear platillo (admin o restaurante dueño) ──
app.post('/menu', auth, requireRole('admin', 'restaurant'), async (req, res) => {
  try {
    const errors = validateMenuItem(req.body)
    if (Object.keys(errors).length > 0)
      return res.status(400).json({ success: false, message: 'Error de validación', errors })

    const { restaurant_id, name, description, price, image, popular } = req.body

    if (!restaurant_id || isNaN(restaurant_id))
      return res.status(400).json({ success: false, message: 'restaurant_id es obligatorio' })

    // Verificar que el restaurante existe
    const rest = await pool.query('SELECT id, owner_id FROM restaurants WHERE id = $1', [restaurant_id])
    if (rest.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Restaurante no encontrado' })

    // El dueño solo puede agregar a su restaurante
    if (req.user.role === 'restaurant' && rest.rows[0].owner_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'No puedes agregar platillos a este restaurante' })

    const result = await pool.query(
      `INSERT INTO menu_items (restaurant_id, name, description, price, image, popular)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [restaurant_id, name.trim(), description?.trim() || null, Number(price), image || null, popular || false]
    )

    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error('POST /menu error:', err.message)
    res.status(500).json({ success: false, message: 'Error al crear platillo' })
  }
})

// ── PUT /menu/:id — actualizar platillo ──────────────────────
app.put('/menu/:id', auth, requireRole('admin', 'restaurant'), async (req, res) => {
  try {
    const { id } = req.params
    if (isNaN(id))
      return res.status(400).json({ success: false, message: 'ID inválido' })

    const existing = await pool.query(
      `SELECT m.*, r.owner_id FROM menu_items m
       JOIN restaurants r ON r.id = m.restaurant_id
       WHERE m.id = $1`, [id]
    )
    if (existing.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Platillo no encontrado' })

    if (req.user.role === 'restaurant' && existing.rows[0].owner_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Sin permiso para editar este platillo' })

    const { name, description, price, image, popular, available } = req.body

    if (name !== undefined) {
      const errors = validateMenuItem({ name, price: price ?? existing.rows[0].price })
      if (Object.keys(errors).length > 0)
        return res.status(400).json({ success: false, message: 'Error de validación', errors })
    }

    const result = await pool.query(
      `UPDATE menu_items SET
        name        = COALESCE($1, name),
        description = COALESCE($2, description),
        price       = COALESCE($3, price),
        image       = COALESCE($4, image),
        popular     = COALESCE($5, popular),
        available   = COALESCE($6, available),
        updated_at  = NOW()
       WHERE id = $7 RETURNING *`,
      [name?.trim(), description?.trim(), price ? Number(price) : null, image, popular, available, id]
    )

    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error('PUT /menu error:', err.message)
    res.status(500).json({ success: false, message: 'Error al actualizar platillo' })
  }
})

// ── DELETE /menu/:id — eliminar (marcar no disponible) ───────
app.delete('/menu/:id', auth, requireRole('admin', 'restaurant'), async (req, res) => {
  try {
    const { id } = req.params
    if (isNaN(id))
      return res.status(400).json({ success: false, message: 'ID inválido' })

    const existing = await pool.query(
      `SELECT m.id, r.owner_id FROM menu_items m
       JOIN restaurants r ON r.id = m.restaurant_id WHERE m.id = $1`, [id]
    )
    if (existing.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Platillo no encontrado' })

    if (req.user.role === 'restaurant' && existing.rows[0].owner_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Sin permiso' })

    await pool.query('UPDATE menu_items SET available = FALSE WHERE id = $1', [id])
    res.json({ success: true, message: 'Platillo eliminado correctamente' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al eliminar platillo' })
  }
})

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ service: 'menu-service', status: 'ok', port: PORT }))

app.listen(PORT, () => console.log(`🍕 Menu Service corriendo en puerto ${PORT}`))
