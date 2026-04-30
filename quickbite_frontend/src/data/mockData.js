export const categories = [
  { id: 1, name: "Pizza", icon: "🍕" },
  { id: 2, name: "Hamburguesas", icon: "🍔" },
  { id: 3, name: "Tacos", icon: "🌮" },
  { id: 4, name: "Sushi", icon: "🍣" },
  { id: 5, name: "Postres", icon: "🍰" },
  { id: 6, name: "Bebidas", icon: "🥤" }
]

export const restaurants = [
  {
    id: 1,
    name: "Pizza House",
    rating: 4.7,
    reviewCount: 342,
    deliveryTime: "30-40 min",
    category: "Pizza",
    minOrder: 150,
    badge: "Popular",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
    address: "Av. Central 45, Col. Centro, Tuxtla Gutiérrez",
    hours: "Lun–Dom · 12:00 pm – 11:00 pm",
    pickupTime: "10-15 min"
  },
  {
    id: 2,
    name: "Burger Town",
    rating: 4.8,
    reviewCount: 519,
    deliveryTime: "20-30 min",
    category: "Hamburguesas",
    minOrder: 100,
    badge: "Más pedido",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80",
    address: "Blvd. Belisario Domínguez 1200, Col. Patria Nueva, Tuxtla Gutiérrez",
    hours: "Lun–Dom · 11:00 am – 12:00 am",
    pickupTime: "8-12 min"
  },
  {
    id: 3,
    name: "Sushi Go",
    rating: 4.6,
    reviewCount: 218,
    deliveryTime: "35-45 min",
    category: "Sushi",
    minOrder: 200,
    badge: null,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80",
    address: "Calle 1a Norte Poniente 820, Col. Centro, Tuxtla Gutiérrez",
    hours: "Mar–Dom · 1:00 pm – 10:30 pm",
    pickupTime: "15-20 min"
  },
  {
    id: 4,
    name: "Taco Loco",
    rating: 4.5,
    reviewCount: 187,
    deliveryTime: "15-25 min",
    category: "Tacos",
    minOrder: 80,
    badge: "Nuevo",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
    address: "Calle 5a Sur Oriente 300, Col. Jardines, Tuxtla Gutiérrez",
    hours: "Lun–Sáb · 8:00 am – 10:00 pm",
    pickupTime: "5-10 min"
  },
  {
    id: 5,
    name: "Sweet Lab",
    rating: 4.6,
    reviewCount: 156,
    deliveryTime: "25-35 min",
    category: "Postres",
    minOrder: 90,
    badge: "Nuevo",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80",
    address: "Av. 14 de Septiembre 750, Col. Espejo 2, Tuxtla Gutiérrez",
    hours: "Lun–Dom · 10:00 am – 9:00 pm",
    pickupTime: "10-15 min"
  },
  {
    id: 6,
    name: "Fresco Bar",
    rating: 4.4,
    reviewCount: 98,
    deliveryTime: "10-20 min",
    category: "Bebidas",
    minOrder: 60,
    badge: null,
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80",
    address: "Libramiento Norte Poniente 2000, Col. Las Granjas, Tuxtla Gutiérrez",
    hours: "Lun–Vie · 7:00 am – 8:00 pm · Sáb–Dom · 8:00 am – 6:00 pm",
    pickupTime: "5-8 min"
  }
]

export const foods = [
  // Pizza House
  { id: 1, restaurantId: 1, name: "Pizza Pepperoni", price: 150, popular: true, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80" },
  { id: 2, restaurantId: 1, name: "Pizza Hawaiana", price: 160, popular: false, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80" },
  { id: 3, restaurantId: 1, name: "Pizza 4 Quesos", price: 175, popular: true, image: "https://images.unsplash.com/photo-1548369937-47519962c11a?w=400&q=80" },

  // Burger Town
  { id: 4, restaurantId: 2, name: "Hamburguesa Clásica", price: 120, popular: true, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80" },
  { id: 5, restaurantId: 2, name: "Hamburguesa BBQ", price: 140, popular: false, image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80" },
  { id: 6, restaurantId: 2, name: "Combo Doble", price: 220, popular: false, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80" },

  // Sushi Go
  { id: 7, restaurantId: 3, name: "Sushi Roll California", price: 180, popular: true, image: "https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=400&q=80" },
  { id: 8, restaurantId: 3, name: "Sushi Roll Especial", price: 220, popular: false, image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&q=80q=80" },
  { id: 9, restaurantId: 3, name: "Nigiri Salmón", price: 160, popular: true, image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&q=80" },

  // Taco Loco
  { id: 10, restaurantId: 4, name: "Taco de Birria", price: 65, popular: true, image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80" },
  { id: 11, restaurantId: 4, name: "Orden de 5 Tacos", price: 120, popular: false, image: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400&q=80" },

  // Sweet Lab — Postres
  { id: 12, restaurantId: 5, name: "Pastel de Chocolate", price: 95, popular: true, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80" },
  { id: 13, restaurantId: 5, name: "Cheesecake de Fresa", price: 85, popular: true, image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80" },
  { id: 14, restaurantId: 5, name: "Brownie con Helado", price: 75, popular: false, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80" },
  { id: 15, restaurantId: 5, name: "Dona Glaseada", price: 55, popular: false, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80" },

  // Fresco Bar — Bebidas
  { id: 16, restaurantId: 6, name: "Smoothie de Mango", price: 65, popular: true, image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80" },
  { id: 17, restaurantId: 6, name: "Limonada Fresca", price: 45, popular: true, image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&q=80" },
  { id: 18, restaurantId: 6, name: "Café Frappé", price: 70, popular: false, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80" },
  { id: 19, restaurantId: 6, name: "Agua de Jamaica", price: 35, popular: false, image: "https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&q=80" }
]

export const orders = [
  { id: 1, userId: 1, restaurantId: 2, items: ["Hamburguesa Clásica", "Hamburguesa BBQ"], total: 260, status: "preparing", date: "2024-01-15" },
  { id: 2, userId: 1, restaurantId: 1, items: ["Pizza Pepperoni"], total: 150, status: "delivered", date: "2024-01-10" }
]
