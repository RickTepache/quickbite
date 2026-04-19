/**
 * validation.js — Middlewares de validación reutilizables
 */

// ── Sanitizar: elimina caracteres peligrosos ─────────────────
const sanitize = (str) => {
  if (typeof str !== 'string') return str
  return str
    .replace(/<[^>]*>/g, '')          // quita HTML
    .replace(/javascript:/gi, '')     // quita JS
    .replace(/on\w+\s*=/gi, '')       // quita event handlers
    .trim()
}

// ── Reglas de validación ─────────────────────────────────────
const rules = {
  name: (v) => {
    if (!v || !v.trim()) return 'El nombre es obligatorio'
    if (v.trim().length < 2) return 'Nombre demasiado corto (mín. 2 caracteres)'
    if (v.trim().length > 60) return 'Nombre demasiado largo (máx. 60 caracteres)'
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\'-]+$/.test(v.trim())) return 'El nombre solo puede contener letras y espacios'
    return null
  },
  email: (v) => {
    if (!v || !v.trim()) return 'El correo es obligatorio'
    if (v.length > 100) return 'Correo demasiado largo'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Correo electrónico inválido'
    return null
  },
  password: (v) => {
    if (!v) return 'La contraseña es obligatoria'
    if (v.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    if (v.length > 72) return 'Contraseña demasiado larga'
    if (!/[a-zA-Z]/.test(v)) return 'La contraseña debe contener al menos una letra'
    if (!/[0-9]/.test(v)) return 'La contraseña debe contener al menos un número'
    return null
  },
  phone: (v) => {
    if (!v) return null // opcional en algunos contextos
    const digits = v.replace(/[\s\-\(\)]/g, '')
    if (!/^\d+$/.test(digits)) return 'El teléfono solo debe contener números'
    if (digits.length !== 10) return 'El teléfono debe tener exactamente 10 dígitos'
    return null
  },
  price: (v) => {
    const n = Number(v)
    if (isNaN(n) || n <= 0) return 'El precio debe ser un número positivo'
    if (n > 99999) return 'El precio es demasiado alto'
    return null
  },
  foodName: (v) => {
    if (!v || !v.trim()) return 'El nombre del platillo es obligatorio'
    if (v.trim().length < 3) return 'Nombre demasiado corto (mín. 3 caracteres)'
    if (v.trim().length > 80) return 'Nombre demasiado largo (máx. 80 caracteres)'
    if (/<[^>]*>|javascript:/i.test(v)) return 'El nombre contiene contenido no permitido'
    return null
  },
  comments: (v) => {
    if (!v) return null
    if (v.length > 200) return 'El comentario no puede exceder 200 caracteres'
    if (/<[^>]*>|javascript:|on\w+\s*=/i.test(v)) return 'El comentario contiene contenido no permitido'
    return null
  },
}

// ── Middleware factory ────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const errors = {}

  for (const [field, validator] of Object.entries(schema)) {
    // Sanitizar el valor antes de validar
    if (req.body[field] !== undefined) {
      req.body[field] = sanitize(req.body[field])
    }
    const error = validator(req.body[field])
    if (error) errors[field] = error
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors
    })
  }
  next()
}

module.exports = { validate, rules, sanitize }
