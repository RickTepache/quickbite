/**
 * auth.middleware.js — Verifica JWT en rutas protegidas
 */
const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token requerido' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' })
  }
}

// Solo permite ciertos roles
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' })
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'No tienes permiso para esta acción' })
  }
  next()
}

module.exports = { authMiddleware, requireRole }
