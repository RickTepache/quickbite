/**
 * seed.js — Pobla la base de datos con datos de prueba
 * Ejecutar: node scripts/seed.js
 */
const { Pool } = require('pg')
const bcrypt   = require('bcrypt')
require('dotenv').config({ path: '../.env' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // ── Limpiar datos existentes (respeta el orden por FK) ──
    await client.query('DELETE FROM order_items')
    await client.query('DELETE FROM orders')
    await client.query('DELETE FROM menu_items')
    await client.query('DELETE FROM restaurants')
    await client.query('DELETE FROM users')
    // Reiniciar secuencias para IDs limpios
    await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1')
    await client.query('ALTER SEQUENCE restaurants_id_seq RESTART WITH 1')
    await client.query('ALTER SEQUENCE menu_items_id_seq RESTART WITH 1')

    // ── Contraseñas ─────────────────────────────────────────
    const adminHash  = await bcrypt.hash('admin123', 10)
    const restHash   = await bcrypt.hash('rest123',  10)
    const userHash   = await bcrypt.hash('user123',  10)

    // ── Usuarios ────────────────────────────────────────────
    // id=1  admin
    // id=2  Burger Town
    // id=3  Pizza House
    // id=4  Sushi Go
    // id=5  Taco Loco
    // id=6  Sweet Lab
    // id=7  Fresco Bar
    // id=8  cliente demo
    await client.query(`
      INSERT INTO users (name, email, password, role, phone) VALUES
        ('Administrador',  'admin@quickbite.com',         $1, 'admin',      '9610000001'),
        ('Burger Town',    'burgertown@quickbite.com',    $2, 'restaurant', '9610000002'),
        ('Pizza House',    'pizzahouse@quickbite.com',    $2, 'restaurant', '9610000003'),
        ('Sushi Go',       'sushigo@quickbite.com',       $2, 'restaurant', '9610000004'),
        ('Taco Loco',      'tacoloco@quickbite.com',      $2, 'restaurant', '9610000005'),
        ('Sweet Lab',      'sweetlab@quickbite.com',      $2, 'restaurant', '9610000006'),
        ('Fresco Bar',     'frescobar@quickbite.com',     $2, 'restaurant', '9610000007'),
        ('Usuario Demo',   'user@quickbite.com',          $3, 'customer',   '9610000008')
    `, [adminHash, restHash, userHash])

    // ── Restaurantes (owner_id = id del usuario correspondiente) ──
    // Burger Town  → owner_id=2
    // Pizza House  → owner_id=3
    // Sushi Go     → owner_id=4
    // Taco Loco    → owner_id=5
    // Sweet Lab    → owner_id=6
    // Fresco Bar   → owner_id=7
    await client.query(`
      INSERT INTO restaurants (owner_id, name, category, rating, review_count, delivery_time, pickup_time, min_order, badge, address, hours, image) VALUES
        (2, 'Burger Town',   'Hamburguesas',  4.8, 519, '20-30 min', '8-12 min',  100, 'Más pedido', 'Blvd. Belisario Domínguez 1200, Col. Patria Nueva, Tuxtla',         'Lun–Dom · 11:00 am – 12:00 am', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80'),
        (3, 'Pizza House',   'Pizza',         4.7, 342, '30-40 min', '10-15 min', 150, 'Popular',    'Av. Central 45, Col. Centro, Tuxtla Gutiérrez',                    'Lun–Dom · 12:00 pm – 11:00 pm', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80'),
        (4, 'Sushi Go',      'Sushi',         4.6, 218, '35-45 min', '15-20 min', 200, NULL,         'Calle 1a Norte Poniente 820, Col. Centro, Tuxtla Gutiérrez',        'Mar–Dom · 1:00 pm – 10:30 pm',  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80'),
        (5, 'Taco Loco',     'Tacos',         4.5, 187, '15-25 min', '5-10 min',  80,  'Nuevo',      'Calle 5a Sur Oriente 300, Col. Jardines, Tuxtla Gutiérrez',         'Lun–Sáb · 8:00 am – 10:00 pm', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80'),
        (6, 'Sweet Lab',     'Postres',       4.6, 156, '25-35 min', '10-15 min', 90,  'Nuevo',      'Av. 14 de Septiembre 750, Col. Espejo 2, Tuxtla Gutiérrez',         'Lun–Dom · 10:00 am – 9:00 pm',  'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80'),
        (7, 'Fresco Bar',    'Bebidas',       4.4, 98,  '10-20 min', '5-8 min',   60,  NULL,         'Libramiento Norte Poniente 2000, Col. Las Granjas, Tuxtla',         'Lun–Vie · 7:00 am – 8:00 pm',  'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80')
    `)

    // ── Menú ─────────────────────────────────────────────────
    // Los IDs de restaurante ahora son:
    // 1=Burger Town  2=Pizza House  3=Sushi Go
    // 4=Taco Loco    5=Sweet Lab    6=Fresco Bar
    await client.query(`
      INSERT INTO menu_items (restaurant_id, name, price, popular, image) VALUES
        (1, 'Hamburguesa Clásica',    120, TRUE,  'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80'),
        (1, 'Hamburguesa BBQ',        140, FALSE, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80'),
        (1, 'Combo Doble',            220, FALSE, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80'),
        (2, 'Pizza Pepperoni',        150, TRUE,  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80'),
        (2, 'Pizza Hawaiana',         160, FALSE, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80'),
        (2, 'Pizza 4 Quesos',         175, TRUE,  'https://images.unsplash.com/photo-1548369937-47519962c11a?w=400&q=80'),
        (3, 'Sushi Roll California',  180, TRUE,  'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=400&q=80'),
        (3, 'Sushi Roll Especial',    220, FALSE, 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400&q=80'),
        (3, 'Nigiri Salmón',          160, TRUE,  'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&q=80'),
        (4, 'Taco de Birria',          65, TRUE,  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80'),
        (4, 'Orden de 5 Tacos',       120, FALSE, 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400&q=80'),
        (5, 'Pastel de Chocolate',     95, TRUE,  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80'),
        (5, 'Cheesecake de Fresa',     85, TRUE,  'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80'),
        (6, 'Smoothie de Mango',       65, TRUE,  'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80'),
        (6, 'Limonada Fresca',         45, TRUE,  'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&q=80')
    `)

    await client.query('COMMIT')
    console.log('✅ Seed completado exitosamente')
    console.log('')
    console.log('Cuentas creadas:')
    console.log('  admin@quickbite.com       / admin123  (admin)')
    console.log('  burgertown@quickbite.com  / rest123   (restaurant)')
    console.log('  pizzahouse@quickbite.com  / rest123   (restaurant)')
    console.log('  sushigo@quickbite.com     / rest123   (restaurant)')
    console.log('  tacoloco@quickbite.com    / rest123   (restaurant)')
    console.log('  sweetlab@quickbite.com    / rest123   (restaurant)')
    console.log('  frescobar@quickbite.com   / rest123   (restaurant)')
    console.log('  user@quickbite.com        / user123   (customer)')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error en seed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
