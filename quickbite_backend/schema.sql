-- ═══════════════════════════════════════════════════════════
--  QuickBite — Schema PostgreSQL
--  Ejecutar: psql -U postgres -d quickbite -f schema.sql
-- ═══════════════════════════════════════════════════════════

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Usuarios ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL,
  email       VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(100) NOT NULL,   -- bcrypt hash
  role        VARCHAR(20)  NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer','restaurant','admin')),
  phone       VARCHAR(15),
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- ── Restaurantes ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurants (
  id            SERIAL PRIMARY KEY,
  owner_id      INT REFERENCES users(id) ON DELETE SET NULL,
  name          VARCHAR(80)  NOT NULL,
  category      VARCHAR(40)  NOT NULL,
  rating        DECIMAL(3,1) DEFAULT 0.0,
  review_count  INT          DEFAULT 0,
  delivery_time VARCHAR(20)  DEFAULT '25-35 min',
  pickup_time   VARCHAR(20)  DEFAULT '10-15 min',
  min_order     INT          DEFAULT 0,
  badge         VARCHAR(30),
  address       TEXT,
  hours         VARCHAR(100),
  image         TEXT,
  active        BOOLEAN      DEFAULT TRUE,
  created_at    TIMESTAMP    DEFAULT NOW()
);

-- ── Menú ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT  NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          VARCHAR(80)  NOT NULL,
  description   TEXT,
  price         INT          NOT NULL CHECK (price > 0),
  image         TEXT,
  popular       BOOLEAN      DEFAULT FALSE,
  available     BOOLEAN      DEFAULT TRUE,
  created_at    TIMESTAMP    DEFAULT NOW(),
  updated_at    TIMESTAMP    DEFAULT NOW()
);

-- ── Pedidos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  user_id         INT  NOT NULL REFERENCES users(id),
  restaurant_id   INT  NOT NULL REFERENCES restaurants(id),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','preparing','ready','delivered','cancelled')),
  delivery_type   VARCHAR(10) NOT NULL DEFAULT 'delivery'
                    CHECK (delivery_type IN ('delivery','pickup')),
  total           INT  NOT NULL CHECK (total >= 0),
  pay_method      VARCHAR(20) DEFAULT 'efectivo',
  -- Datos de entrega (nulos si es pickup)
  address_street  VARCHAR(100),
  address_colony  VARCHAR(60),
  address_city    VARCHAR(50),
  address_refs    VARCHAR(100),
  customer_phone  VARCHAR(15),
  -- Datos de pickup
  pickup_name     VARCHAR(60),
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ── Items del pedido ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id              SERIAL PRIMARY KEY,
  order_id        INT  NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id    INT  REFERENCES menu_items(id) ON DELETE SET NULL,
  name            VARCHAR(80) NOT NULL,   -- snapshot del nombre
  unit_price      INT  NOT NULL,
  extras_price    INT  DEFAULT 0,
  quantity        INT  NOT NULL CHECK (quantity > 0),
  -- Personalización (JSON)
  extras          TEXT,   -- JSON array de strings
  removed         TEXT,   -- JSON array de strings
  spicy_level     VARCHAR(10) DEFAULT 'normal',
  comments        VARCHAR(200)
);

-- ── Índices ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_user     ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_rest     ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);
CREATE INDEX IF NOT EXISTS idx_menu_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_users_email     ON users(email);
