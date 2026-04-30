# 🍔 QuickBite

Plataforma de pedidos de comida a domicilio desarrollada con arquitectura de microservicios.

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white)

---

## 📋 Requisitos previos

Antes de comenzar asegúrate de tener instalado:

- [Node.js](https://nodejs.org) v18 o superior
- [PostgreSQL](https://www.postgresql.org/download) v14 o superior
- Git

---

## ⚡ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/RickTepache/quickbite.git
cd quickbite
```

---

### 2. Configurar la base de datos

Abre PostgreSQL y crea la base de datos:

```bash
psql -U tu_usuario_postgres
```

```sql
CREATE DATABASE quickbite;
\q
```

Ejecuta el schema:

```bash
psql -U tu_usuario_postgres -d quickbite -f quickbite_backend/schema.sql
```

> 💡 En **Mac con Homebrew** el usuario suele ser tu nombre de usuario del sistema (ej. `ricardopina`). En **Windows** suele ser `postgres`.

---

### 3. Configurar el backend

```bash
cd quickbite_backend
```

Crea un archivo llamado `.env` en esa carpeta con el siguiente contenido:

```env
DATABASE_URL=postgresql://tu_usuario_postgres@localhost:5432/quickbite
JWT_SECRET=quickbite_jwt_secret
JWT_EXPIRES_IN=7d
GATEWAY_PORT=4000
AUTH_PORT=4001
RESTAURANT_PORT=4002
MENU_PORT=4003
ORDER_PORT=4004
USER_PORT=4005
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Instala dependencias y carga los datos de prueba:

```bash
npm install
DATABASE_URL=postgresql://tu_usuario_postgres@localhost:5432/quickbite node scripts/seed.js
```

Si el seed fue exitoso verás:

```
✅ Seed completado exitosamente
```

Inicia el backend:

```bash
npm run dev
```

---

### 4. Configurar el frontend

Abre una **nueva terminal** y ejecuta:

```bash
cd quickbite/quickbite_frontend
npm install
npm run dev
```

---

### 5. Abrir en el navegador

```
http://localhost:5173
```

---

## 🔑 Cuentas de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@quickbite.com | admin123 |
| Burger Town | burgertown@quickbite.com | rest123 |
| Pizza House | pizzahouse@quickbite.com | rest123 |
| Sushi Go | sushigo@quickbite.com | rest123 |
| Taco Loco | tacoloco@quickbite.com | rest123 |
| Sweet Lab | sweetlab@quickbite.com | rest123 |
| Fresco Bar | frescobar@quickbite.com | rest123 |
| Cliente demo | user@quickbite.com | user123 |

---

## 🏗️ Arquitectura

```
quickbite/
├── quickbite_backend/
│   ├── gateway/              # API Gateway (puerto 4000)
│   ├── services/
│   │   ├── auth-service/     # Autenticación JWT (puerto 4001)
│   │   ├── restaurant-service/ # Restaurantes (puerto 4002)
│   │   ├── menu-service/     # Menú y platillos (puerto 4003)
│   │   ├── order-service/    # Pedidos (puerto 4004)
│   │   └── user-service/     # Usuarios (puerto 4005)
│   ├── shared/               # Middlewares compartidos
│   ├── scripts/
│   │   └── seed.js           # Datos de prueba
│   └── schema.sql            # Esquema de la base de datos
└── quickbite_frontend/
    └── src/
        ├── domain/           # Entidades y repositorios
        ├── infrastructure/   # API client y repositorios
        ├── ui/
        │   ├── components/   # Componentes reutilizables
        │   ├── context/      # AuthContext, CartContext
        │   └── pages/        # Vistas principales
        └── routes/           # Configuración de rutas
```

---

## 🛠️ Stack tecnológico

**Frontend**
- React 19 + Vite
- React Router v7
- Context API (Auth + Carrito)

**Backend**
- Node.js + Express
- Arquitectura de microservicios
- API Gateway centralizado
- JWT para autenticación

**Base de datos**
- PostgreSQL

---

## ⚠️ Problemas frecuentes

**Error: `client password must be a string`**
Tu PostgreSQL no tiene contraseña configurada. Usa tu usuario del sistema en la `DATABASE_URL`:
```
DATABASE_URL=postgresql://tu_usuario@localhost:5432/quickbite
```

**Error: `repository not found` al hacer push**
Verifica que el remote apunte al repo correcto:
```bash
git remote set-url origin https://github.com/RickTepache/quickbite.git
```

**El frontend no conecta al backend**
Verifica que el archivo `quickbite_frontend/.env` exista y contenga:
```
VITE_USE_BACKEND=true
VITE_API_URL=http://localhost:4000/api
```
