# QuickBite — Backend

Arquitectura de microservicios con Node.js + Express + PostgreSQL.

## Estructura

```
quickbite-backend/
├── gateway/              # API Gateway (puerto 4000)
├── services/
│   ├── auth-service/     # Autenticación JWT (puerto 4001)
│   ├── restaurant-service/ # Restaurantes (puerto 4002)
│   ├── menu-service/     # Menú (puerto 4003)
│   ├── order-service/    # Pedidos (puerto 4004)
│   └── user-service/     # Usuarios (puerto 4005)
├── shared/               # Módulos compartidos (db, validación, JWT)
├── scripts/              # Seed de datos
├── schema.sql            # Esquema de la base de datos
└── .env.example          # Variables de entorno
```

## Instalación paso a paso

### 1. Requisitos previos
- Node.js 18+
- PostgreSQL 14+

### 2. Crear la base de datos

```bash
psql -U postgres
CREATE DATABASE quickbite;
\q
psql -U postgres -d quickbite -f schema.sql
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tu contraseña de PostgreSQL
```

### 4. Instalar dependencias

```bash
# Gateway
cd gateway && npm install && cd ..

# Cada microservicio
cd services/auth-service && npm install && cd ../..
cd services/restaurant-service && npm install && cd ../..
cd services/menu-service && npm install && cd ../..
cd services/order-service && npm install && cd ../..
cd services/user-service && npm install && cd ../..
```

### 5. Poblar la base de datos (seed)

```bash
cd scripts
npm install pg bcrypt dotenv
node seed.js
```

### 6. Iniciar los servicios

Abrir **6 terminales** (una por servicio + gateway):

```bash
# Terminal 1 — Gateway
cd gateway && npm run dev

# Terminal 2 — Auth
cd services/auth-service && npm run dev

# Terminal 3 — Restaurants
cd services/restaurant-service && npm run dev

# Terminal 4 — Menu
cd services/menu-service && npm run dev

# Terminal 5 — Orders
cd services/order-service && npm run dev

# Terminal 6 — Users
cd services/user-service && npm run dev
```

### 7. Verificar que todo funciona

```
GET http://localhost:4000/health
```

Deberías ver todos los servicios con status "ok".

## Conectar con el frontend

En la carpeta `quickbite/` (frontend):

```bash
cp .env.example .env
# Cambiar VITE_USE_BACKEND=true
```

## Endpoints principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/auth/register | Crear cuenta |
| POST | /api/auth/login | Iniciar sesión |
| GET  | /api/auth/me | Perfil del usuario autenticado |
| GET  | /api/restaurants | Listar restaurantes |
| GET  | /api/restaurants/:id | Detalle de restaurante |
| GET  | /api/menu/:restaurantId | Menú de un restaurante |
| POST | /api/orders | Crear pedido |
| GET  | /api/orders/my | Mis pedidos |
| PATCH| /api/orders/:id/status | Cambiar estado del pedido |
| GET  | /api/users/me | Mi perfil |
| PUT  | /api/users/me | Actualizar perfil |

## Credenciales de prueba (después del seed)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@test.com | admin123 |
| Restaurante | restaurant@test.com | rest123 |
| Cliente | user@test.com | user123 |
