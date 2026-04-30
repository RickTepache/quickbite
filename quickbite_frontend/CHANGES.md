# 🍔 QuickBite — Cambios v2

Resumen de todo lo que cambió en esta versión. Está organizado por área para que sea fácil saltar a lo que te interesa.

---

## 1. ♿ Accesibilidad (subimos todo en general)

Cambios en **`src/index.css`** que se heredan en toda la app:

### Tipografía
- **Base subió de 15px → 17px** (~13% más grande)
- Nueva escala con tokens `--fs-xs` hasta `--fs-4xl` (consistente en toda la app)
- En tablets seguimos con 16px (un escalón abajo, no como antes que bajaba a 15)

### Contraste
- `--text` pasó de `#1a1a1a` a `#111111` (texto principal más oscuro)
- `--text-muted` pasó de `#6b6b6b` a `#555555` — ahora tiene contraste **AAA** (~7:1) en lugar de AA
- `--border` más visible (`#e5e2db` → `#d8d4cc`)
- Nuevo `--border-strong` para separadores fuertes

### Touch targets
- Token `--touch-min: 44px` aplicado a todos los botones, links del nav, items de menús y campos de formulario
- Botones de `+/-` en carrito: 30px → 40px
- Botones del modal: 32px → 44px+

### Foco visible (teclado)
- Outline de **3px naranja brand** con offset en `*:focus-visible`
- Nadie navegando con teclado se va a perder

### Iconos
- 24px → 32-40px en categorías
- 28px → 36-44px en social/contacto
- Spinners 40px → 52px

### Reduce motion
- Soporte para `prefers-reduced-motion: reduce` — si el usuario lo tiene activado, todas las animaciones y transiciones se reducen a 0.01ms

### ARIA y semántica
- `role="alert"`, `role="status"`, `aria-live` en mensajes dinámicos
- `aria-label` en todos los botones de icono (cerrar, eliminar, etc.)
- `aria-pressed` / `aria-expanded` / `aria-current` en botones togglables y nav
- `role="dialog"` + `aria-modal` en todos los modales
- Cierre con **Escape** en modal de productos y menú de perfil del navbar

---

## 2. 🛡️ Validators reforzados (`src/utils/validators.js`)

Ahora se detectan estos casos extra que antes pasaban como buenos:

### Casos generales (todos los campos texto)
- Solo espacios en blanco (`"   "`)
- Caracteres invisibles / zero-width (`\u200B`, RTL hijacks, control chars)
- Patrones XSS: `<script>`, `<iframe>`, `javascript:`, `data:text/html`, `vbscript:`, eventos `onClick=`/`onerror=`
- Patrones SQL obvios: `DROP TABLE`, `UNION SELECT`, `-- ;`

### Email
- Doble `@` en el correo
- Puntos consecutivos (`..`)
- Punto al inicio o final del local/dominio
- TLD numérico (`@dominio.123`)
- Espacios internos

### Contraseña
- No solo espacios (`"      "`)
- Caracteres invisibles
- Mantiene las reglas: mín. 6, máx. 72, al menos 1 letra y 1 número

### Teléfono (10 dígitos MX)
- Acepta separadores comunes (espacios, guiones, paréntesis, puntos)
- Acepta prefijo `+52` o `52` y los quita automáticamente
- **Rechaza** números que empiezan con 0 o 1 (no son válidos en MX)
- **Rechaza** todos dígitos iguales (`1111111111`, `0000000000`)

### Nombre / Calle / Colonia / Ciudad
- Rechaza nombres solo numéricos
- Rechaza más de 2 espacios seguidos
- Rechaza guiones/apóstrofos consecutivos (`Juan---Pérez`)
- Calle requiere al menos un dígito (para el número)

### Precio
- Rechaza notación científica (`1e3`), hexadecimal (`0x1A`), binaria
- Solo dígitos con hasta 2 decimales
- Rango: 0.01 a 99,999

### Cantidad
- Solo enteros
- Rango: 1-99

### Categoría (admin)
- Whitelist: Pizza, Hamburguesas, Tacos, Sushi, Postres, Bebidas, Otro

### Rating (admin)
- Rango 0-5, máx. 1 decimal

### Tiempo de entrega (admin)
- Formato estricto: `"20 min"` o `"20-30 min"`

### URL de imagen
- Solo `http://` o `https://` (bloquea `javascript:`, `data:`, `file:`)

### Comentarios libres
- Bloquea XSS, máx. 200 caracteres

### Sanitizadores nuevos
```js
sanitize.text(val)    // Quita invisible chars + trim
sanitize.digits(val)  // Solo dígitos
sanitize.email(val)   // Trim + lowercase + sin espacios
```

---

## 3. ⚙️ AdminDashboard nuevo — `src/ui/pages/AdminDashboard.jsx`

Reescrito completo. **Conectado al backend** vía `restaurantsAPI`, `ordersAPI`, `usersAPI`, `menuAPI`.

### 4 vistas con sidebar
1. **Resumen** — 6 KPIs + pedidos recientes
2. **Restaurantes** — grid con CRUD completo
3. **Pedidos** — todos los del sistema con badges de estado
4. **Usuarios** — tabla con eliminar (admin no se puede borrar a sí mismo)

### KPIs en vivo
- Restaurantes totales
- Pedidos totales
- Platillos totales
- **Ingresos de pedidos entregados** (suma de totals donde status = 'delivered')
- Clientes registrados
- Pedidos entregados

### CRUD de restaurantes (modal completo)
Campos: Nombre, Categoría (select), Rating, Tiempo de entrega, Pedido mínimo, URL de imagen (con preview), Badge (select), Dirección
- Cada campo pasa por sus validators
- Confirma antes de eliminar
- Si el back falla, muestra el error sin romper la UI

### Tolerancia a fallas
- Si `/users` no existe en el back todavía, muestra mensaje claro y mantiene el resto del panel funcional
- Si `/orders` (admin) no existe, hace fallback a mock para que veas algo
- `Promise.allSettled` — un endpoint roto no tira a los demás

### Compatibilidad con el back
Cada payload manda **camelCase Y snake_case** del mismo campo (`deliveryTime` + `delivery_time`, `minOrder` + `min_order`, `pickupTime` + `pickup_time`). Cuando me pases tu schema final ajustamos para mandar solo los nombres correctos.

---

## 4. 📞 Teléfono en Registro — `src/ui/pages/Register.jsx`

- Campo nuevo `phone`, **obligatorio**, 10 dígitos MX
- Acepta el formato que sea: `9612345678`, `961 234 5678`, `+52 961 234 5678`
- Al enviar al back se manda **solo dígitos** (limpio del prefijo +52)
- `register(name, email, password, phone)` ahora pasa los 4 args al `authAPI`

---

## 5. 🔑 AuthService sincronizado — `src/infrastructure/services/AuthService.js`

Las credenciales mock ahora coinciden con la cajita de "Cuentas de prueba" del Login:
- `admin@test.com` / `admin123`
- `restaurant@test.com` / `rest123`
- `user@test.com` / `user123`

(Antes las contraseñas eran `admin`/`rest`/`user` y la pantalla mostraba otras — ya no se contradicen.)

---

## 6. 🌐 API mejorada — `src/infrastructure/api/api.js`

- Detecta errores de red (sin internet/back caído) con mensaje amigable
- Maneja respuestas vacías sin reventar (`DELETE` con 204 ya no causa error de parseo)
- URLs con query params usan `encodeURIComponent`
- Nuevo: `ordersAPI.getAll()` para que el admin vea todos los pedidos
- Nuevo: `usersAPI.getAll()`, `usersAPI.remove(id)` para gestión de usuarios

---

## 7. 🍔 RestaurantDashboard

- En modo backend (`VITE_USE_BACKEND=true`) **arranca con `[]`** y los pedidos vienen del API. **Ya no muestra los datos falsos de Carlos M., Ana L., etc.**
- En modo mock sigue mostrando el demo para que el panel se vea con vida sin backend
- Todos los tamaños subidos (mismo criterio que el resto)
- Touch targets en filtros, botones de avanzar pedido, edit/delete de menú

---

## 8. 📁 Archivos tocados

```
src/
├── index.css                            ← tokens accesibles
├── utils/validators.js                  ← reforzados
├── infrastructure/
│   ├── api/api.js                       ← admin endpoints + mejor errores
│   └── services/AuthService.js          ← creds sincronizados
└── ui/
    ├── components/
    │   ├── FieldError.jsx               ← tamaños accesibles
    │   ├── Footer.jsx                   ← tamaños accesibles + ARIA
    │   ├── Navbar.jsx                   ← tamaños + dropdown perfil + ARIA + Escape
    │   ├── OffersCarousel.jsx           ← tamaños + ARIA + auto-play más lento
    │   ├── ProductModal.jsx             ← tamaños + Escape + valida cantidad
    │   ├── ProtectedRoute.jsx           ← spinner más grande
    │   └── RestaurantCard.jsx           ← tamaños + aria-label completo
    └── pages/
        ├── AdminDashboard.jsx           ← REESCRITO (CRUD + 4 vistas)
        ├── Cart.jsx                     ← tamaños + aria
        ├── Checkout.jsx                 ← tamaños (parche)
        ├── Home.jsx                     ← tamaños
        ├── Login.jsx                    ← tamaños + show/hide pw + aria
        ├── MyOrders.jsx                 ← tamaños + safer JSON.parse
        ├── Register.jsx                 ← TELÉFONO obligatorio + tamaños
        ├── Restaurant.jsx               ← tamaños
        └── RestaurantDashboard.jsx      ← gate INITIAL_ORDERS + tamaños

.env.example                              ← NUEVO
CHANGES.md                                ← NUEVO (este archivo)
```

---

## 9. 🚀 Para correrlo

```bash
cp .env.example .env
# Edita .env con tu URL del backend y VITE_USE_BACKEND=true|false

npm install
npm run dev
```

### Build
```bash
npm run build
# Verificado: builds clean en ~330ms
```

---

## 10. 📌 Pendientes / cosas que pueden necesitar ajuste

1. **Schema del backend**: el AdminDashboard manda `camelCase` y `snake_case` a la vez. Cuando me pases tu back ajustamos a los nombres reales.

2. **Endpoint `/users` (admin)**: si todavía no existe en tu back, la pestaña de Usuarios mostrará un mensaje claro de "no se pudieron cargar". Cuando lo tengas, todo se conecta solo.

3. **Endpoint `/orders` (admin)**: si no existe, hace fallback a mock por ahora. Idealmente que tu back tenga un GET `/orders` que devuelva todos.

4. **Validators de back**: estos validators son del **front**. Tu back **debe** validar lo mismo (o más fuerte) — los validators del front son UX, no seguridad.

5. **Phone en login del back**: el `authAPI.register` ahora manda 4 args. Si tu endpoint `/auth/register` aún no lee `phone`, hay que agregarle el campo a la tabla `users` y a la query de inserción.
