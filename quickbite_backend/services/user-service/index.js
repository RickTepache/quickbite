/**
 * User Service — Puerto 4005
 * Responsabilidades: perfil de usuario, actualizar datos, admin de usuarios
 */
require('dotenv').config({ path: '../../.env' })
const express = require('express')
const cors    = require('cors')
const jwt     = require('jsonwebtoken')
const bcrypt  = require('bcrypt')
const { Pool } = require('pg')

const app  = express()
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const PORT = process.env.USER_PORT || 4005

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

// ── GET /users/me — obtener perfil ───────────────────────────
app.get('/users/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1',
      [req.user.id]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' })

    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener perfil' })
  }
})

// ── PUT /users/me — actualizar perfil ────────────────────────
app.put('/users/me', auth, async (req, res) => {
  try {
    const { name, phone } = req.body
    const errors = {}

    if (name !== undefined) {
      if (!name?.trim() || name.trim().length < 2) errors.name = 'Nombre inválido (mín. 2 caracteres)'
      if (name.trim().length > 60) errors.name = 'Nombre demasiado largo'
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\'-]+$/.test(name.trim())) errors.name = 'Solo letras y espacios'
    }
    if (phone !== undefined && phone) {
      const digits = phone.replace(/[\s\-\(\)]/g, '')
      if (!/^\d{10}$/.test(digits)) errors.phone = 'Teléfono de 10 dígitos requerido'
    }
    if (Object.keys(errors).length > 0)
      return res.status(400).json({ success: false, message: 'Error de validación', errors })

    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        updated_at = NOW()
       WHERE id = $3 RETURNING id, name, email, role, phone`,
      [name?.trim() || null, phone?.trim() || null, req.user.id]
    )

    res.json({ success: true, data: result.rows[0] })
  } catch (err) {
    console.error('PUT /users/me error:', err.message)
    res.status(500).json({ success: false, message: 'Error al actualizar perfil' })
  }
})

// ── PUT /users/me/password — cambiar contraseña ──────────────
app.put('/users/me/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Ambas contraseñas son requeridas' })
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' })
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword))
      return res.status(400).json({ success: false, message: 'La contraseña debe tener letras y números' })
    if (newPassword.length > 72)
      return res.status(400).json({ success: false, message: 'Contraseña demasiado larga' })

    const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id])
    const match = await bcrypt.compare(currentPassword, result.rows[0].password)
    if (!match)
      return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta' })

    const hashed = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashed, req.user.id])

    res.json({ success: true, message: 'Contraseña actualizada correctamente' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al cambiar contraseña' })
  }
})

// ── GET /users — listar todos (solo admin) ───────────────────
app.get('/users', auth, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC'
    )
    res.json({ success: true, data: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' })
  }
})

// ── DELETE /users/:id — eliminar (solo admin) ────────────────
app.delete('/users/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params
    if (isNaN(id))
      return res.status(400).json({ success: false, message: 'ID inválido' })
    if (Number(id) === req.user.id)
      return res.status(400).json({ success: false, message: 'No puedes eliminar tu propia cuenta' })

    await pool.query('DELETE FROM users WHERE id = $1', [id])
    res.json({ success: true, message: 'Usuario eliminado correctamente' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al eliminar usuario' })
  }
})

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ service: 'user-service', status: 'ok', port: PORT }))

app.listen(PORT, () => console.log(`👤 User Service corriendo en puerto ${PORT}`))
