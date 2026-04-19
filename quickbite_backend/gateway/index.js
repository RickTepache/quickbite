/**
 * API Gateway — Puerto 4000
 * Proxy manual con http nativo
 */
require('dotenv').config({ path: '../.env' })
const express = require('express')
const http    = require('http')
const cors    = require('cors')

const app  = express()
const PORT = process.env.GATEWAY_PORT || 4000

const SERVICES = {
  auth:        { host: 'localhost', port: Number(process.env.AUTH_PORT)        || 4001 },
  restaurants: { host: 'localhost', port: Number(process.env.RESTAURANT_PORT)  || 4002 },
  menu:        { host: 'localhost', port: Number(process.env.MENU_PORT)        || 4003 },
  orders:      { host: 'localhost', port: Number(process.env.ORDER_PORT)       || 4004 },
  users:       { host: 'localhost', port: Number(process.env.USER_PORT)        || 4005 },
}

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}))

// ── Logging ───────────────────────────────────────────────────
app.use((req, _, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`)
  next()
})

// ── Función proxy manual ──────────────────────────────────────
// mountPath: '/api/auth' → servicePrefix: '/auth'
function proxyTo(service, servicePrefix) {
  return (req, res) => {
    const target = SERVICES[service]

    // req.url es relativo al mount point, ej: '/login'
    // necesitamos: '/auth/login'
    const fullPath = servicePrefix + req.url

    console.log(`  → Proxy ${service} : ${fullPath}`)

    // Leer el body completo primero
    let body = []
    req.on('data', chunk => body.push(chunk))
    req.on('end', () => {
      const bodyBuffer = Buffer.concat(body)

      const options = {
        hostname: target.host,
        port:     target.port,
        path:     fullPath,
        method:   req.method,
        headers:  {
          ...req.headers,
          host:             `${target.host}:${target.port}`,
          'content-length': bodyBuffer.length,
        },
      }

      const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers)
        proxyRes.pipe(res, { end: true })
      })

      proxyReq.on('error', (err) => {
        console.error(`Error proxy → ${service}:`, err.message)
        if (!res.headersSent)
          res.status(503).json({ success: false, message: `Servicio ${service} no disponible` })
      })

      if (bodyBuffer.length > 0) proxyReq.write(bodyBuffer)
      proxyReq.end()
    })
  }
}

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api/auth',        proxyTo('auth',        '/auth'))
app.use('/api/restaurants', proxyTo('restaurants', '/restaurants'))
app.use('/api/menu',        proxyTo('menu',        '/menu'))
app.use('/api/orders',      proxyTo('orders',      '/orders'))
app.use('/api/users',       proxyTo('users',       '/users'))

// ── Health check ──────────────────────────────────────────────
app.get('/health', async (_, res) => {
  const results = {}
  const checks = Object.entries(SERVICES).map(([name, svc]) =>
    new Promise((resolve) => {
      const req = http.get(
        { hostname: svc.host, port: svc.port, path: '/health', timeout: 2000 },
        (r) => { results[name] = r.statusCode === 200 ? 'ok' : 'error'; resolve() }
      )
      req.on('error',   () => { results[name] = 'unreachable'; resolve() })
      req.on('timeout', () => { results[name] = 'timeout';     resolve() })
    })
  )
  await Promise.all(checks)
  const allOk = Object.values(results).every(v => v === 'ok')
  res.status(allOk ? 200 : 207).json({
    gateway: 'ok', services: results, timestamp: new Date().toISOString()
  })
})

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` })
})

app.listen(PORT, () => {
  console.log(`\n🚀 API Gateway en http://localhost:${PORT}`)
  console.log(`   /api/auth        → :${SERVICES.auth.port}/auth`)
  console.log(`   /api/restaurants → :${SERVICES.restaurants.port}/restaurants`)
  console.log(`   /api/menu        → :${SERVICES.menu.port}/menu`)
  console.log(`   /api/orders      → :${SERVICES.orders.port}/orders`)
  console.log(`   /api/users       → :${SERVICES.users.port}/users\n`)
})
