/**
 * Auth Service — Puerto 4001
 * Responsabilidades: registro, login, verificar token
 */
require('dotenv').config({ path: '../../.env' })
const express = require('express')
const bcrypt  = require('bcrypt')
const jwt     = require('jsonwebtoken')
const cors    = require('cors')
const { Pool } = require('pg')

const app  = express()
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const PORT = process.env.AUTH_PORT || 4001

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

// ── Validaciones internas ────────────────────────────────────
const validateRegister = (body) => {
  const errors = {}
  const { name, email, password } = body

  if (!name || name.trim().length < 2 || name.trim().length > 60)
    errors.name = 'Nombre inválido (2-60 caracteres)'
  if (name && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\'-]+$/.test(name.trim()))
    errors.name = 'El nombre solo puede contener letras y espacios'

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    errors.email = 'Correo electrónico inválido'
  if (email && email.length > 100)
    errors.email = 'Correo demasiado largo'

  if (!password || password.length < 6)
    errors.password = 'La contraseña debe tener al menos 6 caracteres'
  if (password && password.length > 72)
    errors.password = 'Contraseña demasiado larga'
  if (password && !/[a-zA-Z]/.test(password))
    errors.password = 'La contraseña debe contener al menos una letra'
  if (password && !/[0-9]/.test(password))
    errors.password = 'La contraseña debe contener al menos un número'
  if (/<[^>]*>|javascript:/i.test(name || '') || /<[^>]*>|javascript:/i.test(email || ''))
    errors.general = 'Contenido no permitido detectado'

  return errors
}

// ── POST /auth/register ──────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  try {
    const errors = validateRegister(req.body)
    if (Object.keys(errors).length > 0)
      return res.status(400).json({ success: false, message: 'Error de validación', errors })

    const { name, email, password, phone } = req.body
    const normalizedEmail = email.trim().toLowerCase()

    // Verificar si el correo ya existe
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail])
    if (existing.rows.length > 0)
      return res.status(409).json({ success: false, message: 'Este correo ya está registrado' })

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insertar usuario
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, 'customer', $4)
       RETURNING id, name, email, role`,
      [name.trim(), normalizedEmail, hashedPassword, phone?.trim() || null]
    )
    const user = result.rows[0]

    // Generar token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.status(201).json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    console.error('Register error:', err.message)
    res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
})

// ── POST /auth/login ─────────────────────────────────────────
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Correo y contraseña son obligatorios' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      return res.status(400).json({ success: false, message: 'Correo electrónico inválido' })

    const normalizedEmail = email.trim().toLowerCase()
    const result = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE email = $1',
      [normalizedEmail]
    )

    if (result.rows.length === 0)
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' })

    const user = result.rows[0]
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch)
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' })

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
})

// ── GET /auth/me — verificar token ──────────────────────────
app.get('/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'Token requerido' })

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const result = await pool.query(
      'SELECT id, name, email, role, phone FROM users WHERE id = $1',
      [decoded.id]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' })

    res.json({ success: true, user: result.rows[0] })
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token inválido o expirado' })
  }
})

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ service: 'auth-service', status: 'ok', port: PORT }))

app.listen(PORT, () => console.log(`🔐 Auth Service corriendo en puerto ${PORT}`))
