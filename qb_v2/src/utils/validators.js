/**
 * validators.js — Reglas de validación reforzadas para QuickBite
 * Cada función retorna { valid: boolean, error: string }
 *
 * Casos cubiertos extra (vs versión original):
 *   - Solo espacios en blanco
 *   - Espacios consecutivos
 *   - Caracteres invisibles / zero-width
 *   - Punycode / homoglyph attacks en email (básico)
 *   - SQL injection patterns más amplios
 *   - XSS extendido (eventos onXxx, javascript:, data:, vbscript:)
 *   - Solo dígitos en nombres
 *   - Dominios de email con sólo TLD numérico
 *   - Teléfonos con prefijo internacional opcional (+52)
 *   - Precio con formato raro (notación científica, hex, etc.)
 *   - URL con protocolos no permitidos
 */

// ── Helpers ──────────────────────────────────────────────────

// Detecta caracteres de control / zero-width / RTL hijack
// eslint-disable-next-line no-control-regex
const HAS_INVISIBLE_CHARS = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF]/

// Patrones inyección genérica (no es defensa final, eso lo hace el back, pero filtra basura)
const HAS_XSS = /<\s*script|<\s*\/script|<\s*iframe|<\s*object|<\s*embed|javascript\s*:|vbscript\s*:|data\s*:\s*text\/html|on\w+\s*=/i
const HAS_SQL_OBVIOUS = /(\bDROP\b\s+\bTABLE\b|\bUNION\b\s+\bSELECT\b|--\s*$|;\s*--)/i

const trim = (v) => (v || "").toString().trim()

export const isEmpty = (val) => {
  const t = trim(val)
  return t.length === 0
}

const hasOnlyWhitespace = (val) => val.length > 0 && trim(val).length === 0

// ── Nombre ──────────────────────────────────────────────────
export const validateName = (val) => {
  if (val == null) return { valid: false, error: "El nombre es obligatorio" }
  const raw = String(val)

  if (hasOnlyWhitespace(raw)) return { valid: false, error: "El nombre no puede ser solo espacios" }
  if (HAS_INVISIBLE_CHARS.test(raw)) return { valid: false, error: "El nombre contiene caracteres no permitidos" }

  const t = trim(raw)
  if (t.length === 0) return { valid: false, error: "El nombre es obligatorio" }
  if (t.length < 2)   return { valid: false, error: "El nombre debe tener al menos 2 caracteres" }
  if (t.length > 60)  return { valid: false, error: "El nombre es demasiado largo (máx. 60 caracteres)" }

  // No permitir solo números
  if (/^\d+$/.test(t)) return { valid: false, error: "El nombre no puede ser solo números" }

  // Solo letras (incluyendo acentos), espacios, guiones y apóstrofos
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(t))
    return { valid: false, error: "El nombre solo puede contener letras y espacios" }

  // No permitir más de 2 espacios consecutivos
  if (/\s{3,}/.test(t)) return { valid: false, error: "El nombre tiene demasiados espacios seguidos" }

  // No permitir guiones/apóstrofos consecutivos (Juan---Pérez)
  if (/[-']{2,}/.test(t)) return { valid: false, error: "El nombre contiene caracteres repetidos no permitidos" }

  return { valid: true, error: "" }
}

// ── Email ───────────────────────────────────────────────────
export const validateEmail = (val) => {
  if (val == null) return { valid: false, error: "El correo es obligatorio" }
  const raw = String(val)

  if (HAS_INVISIBLE_CHARS.test(raw)) return { valid: false, error: "El correo contiene caracteres no permitidos" }
  if (hasOnlyWhitespace(raw))        return { valid: false, error: "El correo no puede ser solo espacios" }

  const t = trim(raw).toLowerCase()
  if (t.length === 0)  return { valid: false, error: "El correo es obligatorio" }
  if (t.length > 100)  return { valid: false, error: "El correo es demasiado largo (máx. 100 caracteres)" }

  // No permitir espacios internos
  if (/\s/.test(t)) return { valid: false, error: "El correo no puede contener espacios" }

  // Doble @
  if ((t.match(/@/g) || []).length !== 1)
    return { valid: false, error: "El correo debe contener exactamente un @" }

  // Regex razonable RFC-básico
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(t))
    return { valid: false, error: "Ingresa un correo válido (ej: nombre@dominio.com)" }

  // Evitar puntos consecutivos
  if (/\.\./.test(t)) return { valid: false, error: "El correo no puede tener puntos consecutivos" }

  // No empezar/terminar el local con punto
  const [local, domain] = t.split("@")
  if (local.startsWith(".") || local.endsWith(".") || domain.startsWith(".") || domain.endsWith("."))
    return { valid: false, error: "El correo tiene un formato inválido" }

  // TLD no puede ser todo numérico
  const tld = domain.split(".").pop()
  if (/^\d+$/.test(tld)) return { valid: false, error: "El dominio del correo no es válido" }

  return { valid: true, error: "" }
}

// ── Contraseña ──────────────────────────────────────────────
export const validatePassword = (val) => {
  if (val == null) return { valid: false, error: "La contraseña es obligatoria" }
  const raw = String(val)

  // No es trim() — los espacios de la contraseña son significativos
  if (raw.length === 0) return { valid: false, error: "La contraseña es obligatoria" }
  if (raw.length < 6)   return { valid: false, error: "La contraseña debe tener al menos 6 caracteres" }
  if (raw.length > 72)  return { valid: false, error: "La contraseña es demasiado larga (máx. 72 caracteres)" }

  // Caracteres invisibles peligrosos
  if (HAS_INVISIBLE_CHARS.test(raw)) return { valid: false, error: "La contraseña contiene caracteres no permitidos" }

  // No solo espacios
  if (/^\s+$/.test(raw)) return { valid: false, error: "La contraseña no puede ser solo espacios" }

  if (!/[a-zA-Z]/.test(raw)) return { valid: false, error: "La contraseña debe contener al menos una letra" }
  if (!/[0-9]/.test(raw))    return { valid: false, error: "La contraseña debe contener al menos un número" }

  return { valid: true, error: "" }
}

export const validatePasswordConfirm = (val, original) => {
  if (val == null || val.length === 0) return { valid: false, error: "Confirma tu contraseña" }
  if (val !== original) return { valid: false, error: "Las contraseñas no coinciden" }
  return { valid: true, error: "" }
}

// ── Teléfono mexicano ───────────────────────────────────────
export const validatePhone = (val) => {
  if (val == null) return { valid: false, error: "El teléfono es obligatorio" }
  const raw = String(val)

  if (hasOnlyWhitespace(raw)) return { valid: false, error: "El teléfono no puede ser solo espacios" }
  if (HAS_INVISIBLE_CHARS.test(raw)) return { valid: false, error: "El teléfono contiene caracteres no permitidos" }

  const t = trim(raw)
  if (t.length === 0) return { valid: false, error: "El teléfono es obligatorio" }

  // Quitar separadores comunes y prefijo +52 si lo trae
  let digits = t.replace(/[\s\-().]/g, "")
  if (digits.startsWith("+52")) digits = digits.slice(3)
  else if (digits.startsWith("52") && digits.length === 12) digits = digits.slice(2)

  if (!/^\d+$/.test(digits)) return { valid: false, error: "El teléfono solo debe contener números" }
  if (digits.length !== 10)  return { valid: false, error: "El teléfono debe tener exactamente 10 dígitos" }

  // Ningún número mexicano real empieza con 0 o 1
  if (/^[01]/.test(digits)) return { valid: false, error: "El teléfono no parece válido (no debe empezar con 0 o 1)" }

  // Todos los dígitos iguales (1111111111)
  if (/^(\d)\1{9}$/.test(digits)) return { valid: false, error: "El teléfono no parece válido" }

  return { valid: true, error: "" }
}

// ── Dirección — Calle y número ──────────────────────────────
export const validateStreet = (val) => {
  if (val == null) return { valid: false, error: "La calle y número son obligatorios" }
  const raw = String(val)

  if (hasOnlyWhitespace(raw)) return { valid: false, error: "La dirección no puede ser solo espacios" }
  if (HAS_INVISIBLE_CHARS.test(raw)) return { valid: false, error: "La dirección contiene caracteres no permitidos" }
  if (HAS_XSS.test(raw)) return { valid: false, error: "La dirección contiene contenido no permitido" }
  if (HAS_SQL_OBVIOUS.test(raw)) return { valid: false, error: "La dirección contiene contenido no permitido" }

  const t = trim(raw)
  if (t.length === 0)  return { valid: false, error: "La calle y número son obligatorios" }
  if (t.length < 5)    return { valid: false, error: "Ingresa una dirección más completa (calle + número)" }
  if (t.length > 100)  return { valid: false, error: "La dirección es demasiado larga (máx. 100 caracteres)" }

  // Solo letras, números, puntos, comas, #, guiones, /
  if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,#\-/]+$/.test(t))
    return { valid: false, error: "La dirección contiene caracteres no permitidos" }

  // Debe contener al menos un dígito (para el número)
  if (!/\d/.test(t)) return { valid: false, error: "Incluye el número de tu domicilio" }

  return { valid: true, error: "" }
}

// ── Dirección — Colonia ─────────────────────────────────────
export const validateColony = (val) => {
  if (val == null) return { valid: false, error: "La colonia es obligatoria" }
  const raw = String(val)

  if (hasOnlyWhitespace(raw)) return { valid: false, error: "La colonia no puede ser solo espacios" }
  if (HAS_INVISIBLE_CHARS.test(raw)) return { valid: false, error: "La colonia contiene caracteres no permitidos" }
  if (HAS_XSS.test(raw)) return { valid: false, error: "La colonia contiene contenido no permitido" }

  const t = trim(raw)
  if (t.length === 0)  return { valid: false, error: "La colonia es obligatoria" }
  if (t.length < 3)    return { valid: false, error: "Ingresa el nombre completo de la colonia" }
  if (t.length > 60)   return { valid: false, error: "El nombre de la colonia es demasiado largo" }

  if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.]+$/.test(t))
    return { valid: false, error: "La colonia contiene caracteres no permitidos" }

  return { valid: true, error: "" }
}

// ── Ciudad ──────────────────────────────────────────────────
export const validateCity = (val) => {
  if (val == null) return { valid: false, error: "La ciudad es obligatoria" }
  const raw = String(val)

  if (hasOnlyWhitespace(raw)) return { valid: false, error: "La ciudad no puede ser solo espacios" }
  const t = trim(raw)
  if (t.length === 0) return { valid: false, error: "La ciudad es obligatoria" }
  if (t.length < 3)   return { valid: false, error: "Ingresa el nombre completo de la ciudad" }
  if (t.length > 60)  return { valid: false, error: "El nombre de la ciudad es demasiado largo" }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.\-]+$/.test(t))
    return { valid: false, error: "La ciudad contiene caracteres no permitidos" }
  return { valid: true, error: "" }
}

// ── Comentarios libres (opcional) ───────────────────────────
export const validateComments = (val) => {
  if (val == null || val === "") return { valid: true, error: "" }
  const raw = String(val)

  if (HAS_INVISIBLE_CHARS.test(raw)) return { valid: false, error: "El comentario contiene caracteres no permitidos" }
  if (HAS_XSS.test(raw)) return { valid: false, error: "El comentario contiene contenido no permitido" }

  if (raw.length > 200) return { valid: false, error: "El comentario no puede exceder 200 caracteres" }
  return { valid: true, error: "" }
}

// ── Precio (admin / restaurant dashboard) ───────────────────
export const validatePrice = (val) => {
  if (val == null || val === "") return { valid: false, error: "El precio es obligatorio" }
  const raw = String(val).trim()

  if (raw.length === 0) return { valid: false, error: "El precio es obligatorio" }

  // Bloquear notación rara: 1e3, 0x1A, 0b101, infinitos, etc.
  if (/[eEoOxXbB]/.test(raw)) return { valid: false, error: "Ingresa un precio en formato normal (ej: 120 o 120.50)" }

  // Solo dígitos y un punto opcional con hasta 2 decimales
  if (!/^\d+(\.\d{1,2})?$/.test(raw))
    return { valid: false, error: "El precio debe ser un número (ej: 120 o 120.50)" }

  const num = Number(raw)
  if (isNaN(num) || !isFinite(num)) return { valid: false, error: "El precio debe ser un número válido" }
  if (num <= 0)     return { valid: false, error: "El precio debe ser mayor a 0" }
  if (num > 99999)  return { valid: false, error: "El precio parece demasiado alto (máx. $99,999)" }

  return { valid: true, error: "" }
}

// ── Nombre de platillo / restaurante ────────────────────────
export const validateFoodName = (val) => {
  if (val == null) return { valid: false, error: "El nombre del platillo es obligatorio" }
  const raw = String(val)

  if (hasOnlyWhitespace(raw)) return { valid: false, error: "El nombre no puede ser solo espacios" }
  if (HAS_INVISIBLE_CHARS.test(raw)) return { valid: false, error: "El nombre contiene caracteres no permitidos" }
  if (HAS_XSS.test(raw)) return { valid: false, error: "El nombre contiene contenido no permitido" }

  const t = trim(raw)
  if (t.length === 0)  return { valid: false, error: "El nombre del platillo es obligatorio" }
  if (t.length < 3)    return { valid: false, error: "El nombre debe tener al menos 3 caracteres" }
  if (t.length > 80)   return { valid: false, error: "El nombre es demasiado largo (máx. 80 caracteres)" }

  // No solo dígitos
  if (/^\d+$/.test(t)) return { valid: false, error: "El nombre no puede ser solo números" }

  return { valid: true, error: "" }
}

// ── Nombre de restaurante (admin) ───────────────────────────
export const validateRestaurantName = (val) => {
  if (val == null) return { valid: false, error: "El nombre del restaurante es obligatorio" }
  const raw = String(val)

  if (hasOnlyWhitespace(raw)) return { valid: false, error: "El nombre no puede ser solo espacios" }
  if (HAS_INVISIBLE_CHARS.test(raw)) return { valid: false, error: "El nombre contiene caracteres no permitidos" }
  if (HAS_XSS.test(raw)) return { valid: false, error: "El nombre contiene contenido no permitido" }

  const t = trim(raw)
  if (t.length === 0)  return { valid: false, error: "El nombre del restaurante es obligatorio" }
  if (t.length < 2)    return { valid: false, error: "El nombre debe tener al menos 2 caracteres" }
  if (t.length > 80)   return { valid: false, error: "El nombre es demasiado largo (máx. 80 caracteres)" }

  return { valid: true, error: "" }
}

// ── Categoría (admin) ───────────────────────────────────────
const VALID_CATEGORIES = ["Pizza", "Hamburguesas", "Tacos", "Sushi", "Postres", "Bebidas", "Otro"]
export const validateCategory = (val) => {
  if (val == null || val === "") return { valid: false, error: "La categoría es obligatoria" }
  if (!VALID_CATEGORIES.includes(val))
    return { valid: false, error: "Selecciona una categoría válida" }
  return { valid: true, error: "" }
}

// ── Rating (admin) ──────────────────────────────────────────
export const validateRating = (val) => {
  if (val == null || val === "") return { valid: false, error: "El rating es obligatorio" }
  const num = Number(val)
  if (isNaN(num) || !isFinite(num)) return { valid: false, error: "El rating debe ser un número" }
  if (num < 0 || num > 5) return { valid: false, error: "El rating debe estar entre 0 y 5" }
  // Hasta 1 decimal
  if (!/^\d(\.\d)?$/.test(String(val).trim()))
    return { valid: false, error: "El rating tiene como máximo 1 decimal (ej: 4.5)" }
  return { valid: true, error: "" }
}

// ── Tiempo de entrega (admin) ───────────────────────────────
// Acepta "20 min", "20-30 min", "30-40 min"
export const validateDeliveryTime = (val) => {
  if (val == null) return { valid: false, error: "El tiempo de entrega es obligatorio" }
  const t = trim(String(val))
  if (t.length === 0) return { valid: false, error: "El tiempo de entrega es obligatorio" }
  if (!/^\d{1,3}(-\d{1,3})?\s*min$/i.test(t))
    return { valid: false, error: "Formato: '20 min' o '20-30 min'" }
  return { valid: true, error: "" }
}

// ── URL de imagen (opcional) ────────────────────────────────
export const validateImageUrl = (val) => {
  if (val == null || val === "") return { valid: true, error: "" }
  const raw = String(val)

  if (HAS_INVISIBLE_CHARS.test(raw)) return { valid: false, error: "La URL contiene caracteres no permitidos" }

  const t = trim(raw)
  if (t.length === 0) return { valid: true, error: "" }
  if (t.length > 500) return { valid: false, error: "La URL es demasiado larga (máx. 500 caracteres)" }

  // Solo http(s) — bloquea javascript:, data:, file:, etc.
  if (!/^https?:\/\//i.test(t))
    return { valid: false, error: "La URL debe empezar con http:// o https://" }

  // Estructura básica de URL
  if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(t))
    return { valid: false, error: "Ingresa una URL válida" }

  return { valid: true, error: "" }
}

// ── Cantidad / unidades ─────────────────────────────────────
export const validateQuantity = (val) => {
  if (val == null || val === "") return { valid: false, error: "La cantidad es obligatoria" }
  const num = Number(val)
  if (isNaN(num) || !isFinite(num)) return { valid: false, error: "Cantidad inválida" }
  if (!Number.isInteger(num))       return { valid: false, error: "La cantidad debe ser un número entero" }
  if (num < 1)    return { valid: false, error: "La cantidad mínima es 1" }
  if (num > 99)   return { valid: false, error: "La cantidad máxima es 99" }
  return { valid: true, error: "" }
}

// ── Helper: validar objeto completo ─────────────────────────
// Retorna { isValid, errors: { campo: string } }
export const validateAll = (rules) => {
  const errors = {}
  for (const [field, result] of Object.entries(rules)) {
    if (!result.valid) errors[field] = result.error
  }
  return { isValid: Object.keys(errors).length === 0, errors }
}

// ── Sanitizadores (para mostrar valores limpios) ────────────
export const sanitize = {
  // Quita espacios y caracteres invisibles
  text: (val) => String(val || "").replace(HAS_INVISIBLE_CHARS, "").trim(),
  // Solo dígitos
  digits: (val) => String(val || "").replace(/\D/g, ""),
  // Email normalizado
  email: (val) => String(val || "").trim().toLowerCase().replace(/\s/g, ""),
}
