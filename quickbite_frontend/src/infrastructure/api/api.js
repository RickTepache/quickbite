/**
 * api.js — Cliente centralizado para comunicarse con el backend
 * Todos los servicios del frontend deben importar desde aquí.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

// ── Callback global para manejar sesión expirada ──────────────
let onSessionExpired = null
export const setSessionExpiredHandler = (handler) => {
  onSessionExpired = handler
}

// ── Helper fetch con manejo de errores ────────────────────────
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('qb_token')

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  }

  let res, data
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, config)
  } catch {
    // El backend no responde / sin internet
    const error = new Error('No se pudo conectar con el servidor. Verifica tu conexión.')
    error.status = 0
    error.networkError = true
    throw error
  }

  // Algunos endpoints (DELETE, 204) pueden no devolver JSON
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { message: text || 'Respuesta inválida del servidor' }
  }

  if (!res.ok) {
    if (res.status === 401 && token) {
      localStorage.removeItem('qb_token')
      if (onSessionExpired) onSessionExpired()
    }

    const error = new Error(data.message || `Error ${res.status}`)
    error.status = res.status
    error.errors = data.errors || {}
    throw error
  }

  return data
}

const get    = (url)         => request(url)
const post   = (url, body)   => request(url, { method: 'POST',   body: JSON.stringify(body) })
const put    = (url, body)   => request(url, { method: 'PUT',    body: JSON.stringify(body) })
const patch  = (url, body)   => request(url, { method: 'PATCH',  body: JSON.stringify(body) })
const del    = (url)         => request(url, { method: 'DELETE' })

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login:    (email, password)              => post('/auth/login',    { email, password }),
  register: (name, email, password, phone) => post('/auth/register', { name, email, password, phone }),
  me:       ()                             => get('/auth/me'),
}

// ── Restaurants ───────────────────────────────────────────────
export const restaurantsAPI = {
  getAll:   (category) => get(`/restaurants${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  getById:  (id)       => get(`/restaurants/${id}`),
  // getMine: devuelve el restaurante del usuario autenticado (si tu back lo tiene)
  getMine:  ()         => get('/restaurants/mine'),
  create:   (data)     => post('/restaurants', data),
  update:   (id, data) => put(`/restaurants/${id}`, data),
  remove:   (id)       => del(`/restaurants/${id}`),
}

// ── Menu ─────────────────────────────────────────────────────
export const menuAPI = {
  getByRestaurant: (restaurantId) => get(`/menu/${restaurantId}`),
  getItem:         (id)           => get(`/menu/item/${id}`),
  create:          (data)         => post('/menu', data),
  update:          (id, data)     => put(`/menu/${id}`, data),
  remove:          (id)           => del(`/menu/${id}`),
}

// ── Orders ────────────────────────────────────────────────────
export const ordersAPI = {
  create:          (data)                  => post('/orders', data),
  getMyOrders:     ()                      => get('/orders/my'),
  getAll:          ()                      => get('/orders'),
  getById:         (id)                    => get(`/orders/${id}`),
  getByRestaurant: (restaurantId, status)  =>
    get(`/orders/restaurant/${restaurantId}${status ? `?status=${status}` : ''}`),
  updateStatus:    (id, status)            => patch(`/orders/${id}/status`, { status }),
  cancel:          (id)                    => patch(`/orders/${id}/status`, { status: 'cancelled' }),
}

// Extrae lista de cualquier formato de respuesta del back
export function extractList(response, fallback = []) {
  if (!response) return fallback
  if (Array.isArray(response)) return response
  const keys = ['data', 'orders', 'items', 'users', 'restaurants', 'menu', 'results', 'list']
  for (const k of keys) {
    if (Array.isArray(response[k])) return response[k]
  }
  return fallback
}

// Extrae el objeto data del response (puede venir envuelto o no)
export function extractData(response) {
  if (!response) return null
  if (response.id) return response
  if (response.data && !Array.isArray(response.data)) return response.data
  if (response.order) return response.order
  if (response.user) return response.user
  return response.data || response
}

// ── Users ─────────────────────────────────────────────────────
export const usersAPI = {
  getProfile:     ()                             => get('/users/me'),
  updateProfile:  (data)                         => put('/users/me', data),
  changePassword: (currentPassword, newPassword) =>
    put('/users/me/password', { currentPassword, newPassword }),
  getAll:         ()                             => get('/users'),
  remove:         (id)                           => del(`/users/${id}`),
}

// ── Token helpers ─────────────────────────────────────────────
export const tokenStorage = {
  save:   (token) => localStorage.setItem('qb_token', token),
  get:    ()      => localStorage.getItem('qb_token'),
  remove: ()      => localStorage.removeItem('qb_token'),
}
