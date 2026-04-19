/**
 * Order Service — Puerto 4004
 * Responsabilidades: crear pedidos, cambiar estado, consultar historial
 */
require('dotenv').config({ path: '../../.env' })
const express = require('express')
const cors    = require('cors')
const jwt     = require('jsonwebtoken')
const { Pool } = require('pg')

const app  = express()
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const PORT = process.env.ORDER_PORT || 4004

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

// ── Auth middleware ──────────────────────────────────────────
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

// ── Validar pedido ────────────────────────────────────────────
const validateOrder = (body) => {
  const errors = {}
  const { items, delivery_type, pay_method } = body

  if (!items || !Array.isArray(items) || items.length === 0)
    errors.items = 'El pedido debe tener al menos un producto'

  if (!['delivery','pickup'].includes(delivery_type))
    errors.delivery_type = 'Tipo de entrega inválido (delivery o pickup)'

  if (!['efectivo','tarjeta'].includes(pay_method))
    errors.pay_method = 'Método de pago inválido'

  if (delivery_type === 'delivery') {
    const { address_street, address_colony, customer_phone } = body
    if (!address_street?.trim() || address_street.trim().length < 5)
      errors.address_street = 'Dirección incompleta'
    if (!address_colony?.trim() || address_colony.trim().length < 3)
      errors.address_colony = 'Colonia requerida'
    const digits = (customer_phone || '').replace(/[\s\-\(\)]/g, '')
    if (!digits || !/^\d{10}$/.test(digits))
      errors.customer_phone = 'Teléfono de 10 dígitos requerido'
  }

  // Validar cada item
  if (Array.isArray(items)) {
    items.forEach((item, i) => {
      if (!item.menu_item_id || isNaN(item.menu_item_id))
        errors[`item_${i}_id`] = `Producto ${i + 1}: ID inválido`
      if (!item.quantity || item.quantity < 1 || item.quantity > 99)
        errors[`item_${i}_qty`] = `Producto ${i + 1}: cantidad inválida`
      if (item.comments && item.comments.length > 200)
        errors[`item_${i}_comments`] = `Producto ${i + 1}: comentario demasiado largo`
      if (item.comments && /<[^>]*>|javascript:/i.test(item.comments))
        errors[`item_${i}_comments`] = `Producto ${i + 1}: comentario con contenido no permitido`
    })
  }

  return errors
}

// ── POST /orders — crear pedido ──────────────────────────────
app.post('/orders', auth, async (req, res) => {
  const client = await pool.connect()
  try {
    const errors = validateOrder(req.body)
    if (Object.keys(errors).length > 0)
      return res.status(400).json({ success: false, message: 'Error de validación', errors })

    const { restaurant_id, items, delivery_type, pay_method,
            address_street, address_colony, address_city, address_refs,
            customer_phone, pickup_name, notes } = req.body

    await client.query('BEGIN')

    // Verificar restaurante
    const restResult = await client.query('SELECT id FROM restaurants WHERE id = $1 AND active = TRUE', [restaurant_id])
    if (restResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ success: false, message: 'Restaurante no encontrado' })
    }

    // Obtener precios reales de la DB (no confiar en los del cliente)
    let total = 0
    const itemsWithPrices = []

    for (const item of items) {
      const menuResult = await client.query(
        'SELECT id, name, price FROM menu_items WHERE id = $1 AND available = TRUE',
        [item.menu_item_id]
      )
      if (menuResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({ success: false, message: `Platillo ID ${item.menu_item_id} no disponible` })
      }

      const menuItem   = menuResult.rows[0]
      const extrasPrice = Number(item.extras_price) || 0
      const unitPrice   = menuItem.price + extrasPrice
      const lineTotal   = unitPrice * item.quantity
      total += lineTotal

      itemsWithPrices.push({ ...item, name: menuItem.name, unit_price: menuItem.price, extras_price: extrasPrice })
    }

    // Crear orden
    const orderResult = await client.query(
      `INSERT INTO orders
        (user_id, restaurant_id, status, delivery_type, total, pay_method,
         address_street, address_colony, address_city, address_refs,
         customer_phone, pickup_name, notes)
       VALUES ($1,$2,'pending',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [req.user.id, restaurant_id, delivery_type, total, pay_method,
       address_street || null, address_colony || null, address_city || 'Tuxtla Gutiérrez', address_refs || null,
       customer_phone || null, pickup_name || null, notes || null]
    )
    const order = orderResult.rows[0]

    // Insertar items
    for (const item of itemsWithPrices) {
      await client.query(
        `INSERT INTO order_items
          (order_id, menu_item_id, name, unit_price, extras_price, quantity, extras, removed, spicy_level, comments)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [order.id, item.menu_item_id, item.name, item.unit_price, item.extras_price,
         item.quantity,
         JSON.stringify(item.extras || []),
         JSON.stringify(item.removed || []),
         item.spicy_level || 'normal',
         item.comments?.trim() || null]
      )
    }

    await client.query('COMMIT')
    res.status(201).json({ success: true, data: { ...order, items: itemsWithPrices } })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('POST /orders error:', err.message)
    res.status(500).json({ success: false, message: 'Error al crear el pedido' })
  } finally {
    client.release()
  }
})

// ── GET /orders/my — historial del usuario autenticado ───────
app.get('/orders/my', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, r.name AS restaurant_name, r.image AS restaurant_image
       FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
       WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
      [req.user.id]
    )
    // Obtener items de cada pedido
    const orders = await Promise.all(result.rows.map(async (order) => {
      const items = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id])
      return { ...order, items: items.rows }
    }))
    res.json({ success: true, data: orders })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener pedidos' })
  }
})

// ── GET /orders/restaurant/:restaurantId — pedidos del restaurante ──
app.get('/orders/restaurant/:restaurantId', auth, requireRole('admin', 'restaurant'), async (req, res) => {
  try {
    const { restaurantId } = req.params
    const { status } = req.query

    let queryText = `SELECT o.*, u.name AS customer_name, u.phone AS customer_phone_profile
                     FROM orders o JOIN users u ON u.id = o.user_id
                     WHERE o.restaurant_id = $1`
    const params = [restaurantId]

    if (status) {
      params.push(status)
      queryText += ` AND o.status = $${params.length}`
    }
    queryText += ' ORDER BY o.created_at DESC'

    const result = await pool.query(queryText, params)
    const orders = await Promise.all(result.rows.map(async (order) => {
      const items = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id])
      return {
        ...order,
        items: items.rows.map(item => ({
          ...item,
          extras: JSON.parse(item.extras || '[]'),
          removed: JSON.parse(item.removed || '[]'),
        }))
      }
    }))

    res.json({ success: true, data: orders })
  } catch (err) {
    console.error('GET /orders/restaurant error:', err.message)
    res.status(500).json({ success: false, message: 'Error al obtener pedidos del restaurante' })
  }
})

// ── GET /orders/:id — detalle de un pedido ───────────────────
app.get('/orders/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    if (isNaN(id))
      return res.status(400).json({ success: false, message: 'ID inválido' })

    const result = await pool.query(
      `SELECT o.*, r.name AS restaurant_name FROM orders o
       JOIN restaurants r ON r.id = o.restaurant_id WHERE o.id = $1`,
      [id]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' })

    const order = result.rows[0]
    // Solo el dueño del pedido o el restaurante/admin pueden verlo
    if (req.user.role === 'customer' && order.user_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Sin permiso' })

    const items = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [id])
    res.json({
      success: true,
      data: {
        ...order,
        items: items.rows.map(i => ({
          ...i,
          extras: JSON.parse(i.extras || '[]'),
          removed: JSON.parse(i.removed || '[]'),
        }))
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener pedido' })
  }
})

// ── PATCH /orders/:id/status — cambiar estado ────────────────
const STATUS_TRANSITIONS = {
  pending:   'preparing',
  preparing: 'ready',
  ready:     'delivered',
}

app.patch('/orders/:id/status', auth, requireRole('admin', 'restaurant'), async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['pending','preparing','ready','delivered','cancelled']
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: 'Estado inválido' })

    const existing = await pool.query('SELECT * FROM orders WHERE id = $1', [id])
    if (existing.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' })

    const order = existing.rows[0]
    // Verificar transición válida (solo avanzar, no retroceder)
    const expectedNext = STATUS_TRANSITIONS[order.status]
    if (status !== 'cancelled' && status !== expectedNext)
      return res.status(400).json({
        success: false,
        message: `No se puede pasar de "${order.status}" a "${status}". El siguiente estado es "${expectedNext}"`
      })

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    )

    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error('PATCH /orders/:id/status error:', err.message)
    res.status(500).json({ success: false, message: 'Error al actualizar estado' })
  }
})

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ service: 'order-service', status: 'ok', port: PORT }))

app.listen(PORT, () => console.log(`📦 Order Service corriendo en puerto ${PORT}`))
