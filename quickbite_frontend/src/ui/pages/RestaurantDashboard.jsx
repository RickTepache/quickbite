import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import { foods } from "../../data/mockData"
import { ordersAPI, menuAPI } from "../../infrastructure/api/api"
import { useAuth } from "../context/AuthContext"

const API_ENABLED = import.meta.env.VITE_USE_BACKEND === 'true'

// Mock orders enriquecidos con detalles de personalización
const INITIAL_ORDERS = [
  {
    id: 1001, customer: "Carlos M.", total: 460, status: "pending", type: "delivery",
    time: "hace 2 min", address: "Av. Central 45, Col. Centro", phone: "961 234 5678",
    payMethod: "efectivo",
    items: [
      { name: "Hamburguesa Clásica", qty: 2, price: 120, extras: ["Extra queso", "Tocino"], removed: ["Pepinillos"], spicy: "normal", comments: "Sin sal por favor" },
      { name: "Combo Doble", qty: 1, price: 220, extras: [], removed: ["Cebolla", "Mostaza"], spicy: "extra", comments: "" },
    ]
  },
  {
    id: 1002, customer: "Ana L.", total: 140, status: "preparing", type: "pickup",
    time: "hace 8 min", address: "Recoger en sucursal", phone: "961 987 6543",
    payMethod: "tarjeta",
    items: [
      { name: "Hamburguesa BBQ", qty: 1, price: 140, extras: ["Aguacate"], removed: [], spicy: "sin", comments: "Bien cocida" },
    ]
  },
  {
    id: 1003, customer: "Roberto S.", total: 560, status: "ready", type: "delivery",
    time: "hace 15 min", address: "Blvd. Norte 200, Col. Las Palmas", phone: "961 111 2233",
    payMethod: "efectivo",
    items: [
      { name: "Combo Doble", qty: 2, price: 220, extras: ["Doble carne"], removed: ["Jitomate"], spicy: "normal", comments: "" },
      { name: "Hamburguesa Clásica", qty: 1, price: 120, extras: [], removed: [], spicy: "normal", comments: "Salsa aparte" },
    ]
  },
  {
    id: 1004, customer: "María G.", total: 120, status: "delivered", type: "pickup",
    time: "hace 40 min", address: "Recoger en sucursal", phone: "961 444 5566",
    payMethod: "efectivo",
    items: [
      { name: "Hamburguesa Clásica", qty: 1, price: 120, extras: [], removed: ["Lechuga", "Mayonesa"], spicy: "sin", comments: "" },
    ]
  },
  {
    id: 1005, customer: "Diego P.", total: 500, status: "delivered", type: "delivery",
    time: "hace 1 hr", address: "Calle 5 Sur 300", phone: "961 777 8899",
    payMethod: "tarjeta",
    items: [
      { name: "Hamburguesa BBQ", qty: 2, price: 140, extras: ["Extra queso", "Tocino"], removed: [], spicy: "extra", comments: "Extra picante de verdad" },
      { name: "Combo Doble", qty: 1, price: 220, extras: [], removed: ["Pepinillos", "Cebolla"], spicy: "normal", comments: "" },
    ]
  },
]

const STATUS_CONFIG = {
  pending:   { label: "Pendiente",   color: "#f59e0b", bg: "#fef9c3", next: "preparing", nextLabel: "Iniciar preparación →" },
  preparing: { label: "Preparando",  color: "#3b82f6", bg: "#dbeafe", next: "ready",     nextLabel: "Marcar como listo →" },
  ready:     { label: "Listo 🔔",    color: "#8b5cf6", bg: "#ede9fe", next: "delivered", nextLabel: "Marcar entregado →" },
  delivered: { label: "Entregado ✓", color: "#16a34a", bg: "#dcfce7", next: null,        nextLabel: null },
  cancelled: { label: "Cancelado ✕",  color: "#dc2626", bg: "#fee2e2", next: null,        nextLabel: null },
}

// El menú inicial en modo mock usa todos los alimentos del primer restaurante conocido.
// En modo backend, se carga dinámicamente según el restaurante del usuario autenticado.
const INITIAL_MENU = API_ENABLED ? [] : foods.filter(f => f.restaurantId === 2)

const BLANK_ITEM = { name: "", price: "", image: "", popular: false }

export default function RestaurantDashboard() {
  const { user } = useAuth()
  const [view, setView] = useState("orders")
  // En modo backend real arrancamos vacío; los pedidos llegan del API.
  // En modo mock usamos datos de demostración para que el panel se vea con vida.
  const [orders, setOrders] = useState(API_ENABLED ? [] : INITIAL_ORDERS)
  const [menu, setMenu] = useState(INITIAL_MENU)
  const [myRestaurantId, setMyRestaurantId] = useState(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [modalItem, setModalItem] = useState(null)
  const [modalForm, setModalForm] = useState(BLANK_ITEM)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [restaurantName, setRestaurantName] = useState("Mi Restaurante")
  const [restaurantEmoji, setRestaurantEmoji] = useState("🍽️")

  // ── Resolver restaurantId del usuario autenticado ───────────
  // El user del JWT debería traer restaurant_id. Si no, buscamos via /restaurants/my
  useEffect(() => {
    if (!API_ENABLED || !user) return
    const rid = user.restaurant_id || user.restaurantId
    if (rid) { setMyRestaurantId(rid); return }
    // Fallback: pedir al back cuál es "mi" restaurante
    import('../../infrastructure/api/api').then(({ restaurantsAPI }) => {
      restaurantsAPI.getMine?.()
        .then(d => { const r = d.data || d; if (r?.id) setMyRestaurantId(r.id) })
        .catch(() => {})
    })
  }, [user])

  // ── Cargar pedidos reales desde el backend ───────────────────
  useEffect(() => {
    if (!API_ENABLED || !myRestaurantId) return

    const loadOrders = async () => {
      setLoadingOrders(true)
      try {
        const restaurantId = myRestaurantId
        const data = await ordersAPI.getByRestaurant(restaurantId)
        // Normalizar: el back puede devolver lista directa o envuelta en data
        const list = Array.isArray(data) ? data
          : Array.isArray(data?.data) ? data.data
          : Array.isArray(data?.orders) ? data.orders : []
        if (list.length > 0) {
          const normalized = list.map(order => ({
            id:        order.id,
            customer:  order.customer_name || 'Cliente',
            total:     order.total,
            status:    order.status,
            type:      order.delivery_type,
            time:      new Date(order.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            address:   order.delivery_type === 'pickup'
                         ? 'Recoger en sucursal'
                         : `${order.address_street || ''}, ${order.address_colony || ''}`.trim(),
            phone:     order.customer_phone || order.customer_phone_profile || '—',
            payMethod: order.pay_method || 'efectivo',
            items: (order.items || []).map(item => ({
              name:     item.name,
              qty:      item.quantity,
              price:    item.unit_price,
              extras:   Array.isArray(item.extras) ? item.extras : JSON.parse(item.extras || '[]'),
              removed:  Array.isArray(item.removed) ? item.removed : JSON.parse(item.removed || '[]'),
              spicy:    item.spicy_level || 'normal',
              comments: item.comments || '',
            }))
          }))
          setOrders(normalized)
        }
      } catch (err) {
        console.error('Error cargando pedidos:', err.message)
      } finally {
        setLoadingOrders(false)
      }
    }

    loadOrders()
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [myRestaurantId])

  // ── Cargar menú real desde el backend ───────────────────────
  useEffect(() => {
    if (!API_ENABLED || !myRestaurantId) return

    const loadMenu = async () => {
      setLoadingMenu(true)
      try {
        const restaurantId = myRestaurantId
        const data = await menuAPI.getByRestaurant(restaurantId)
        // Obtener nombre del restaurante
        const restInfo = await import("../../infrastructure/api/api").then(m => m.restaurantsAPI.getById(restaurantId))
        if (restInfo?.data?.name) {
          setRestaurantName(restInfo.data.name)
          // Emoji según categoría
          const emojiMap = { 'Pizza': '🍕', 'Hamburguesas': '🍔', 'Sushi': '🍣', 'Tacos': '🌮', 'Postres': '🍰', 'Bebidas': '🥤' }
          setRestaurantEmoji(emojiMap[restInfo.data.category] || '🍽️')
        }
        if (data.data && data.data.length > 0) {
          setMenu(data.data.map(item => ({
            id:           item.id,
            restaurantId: item.restaurant_id,
            name:         item.name,
            price:        item.price,
            image:        item.image || null,
            popular:      item.popular || false,
          })))
        }
      } catch (err) {
        console.error('Error cargando menú:', err.message)
      } finally {
        setLoadingMenu(false)
      }
    }

    loadMenu()
  }, [myRestaurantId])

  // ── Avanzar estado del pedido ────────────────────────────────
  const advanceOrder = async (id) => {
    const order = orders.find(o => o.id === id)
    if (!order) return
    const cfg = STATUS_CONFIG[order.status]
    if (!cfg.next) return

    // Actualizar UI inmediatamente (optimistic update)
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, status: cfg.next } : o
    ))

    // Si hay backend, sincronizar
    if (API_ENABLED) {
      try {
        await ordersAPI.updateStatus(id, cfg.next)
      } catch (err) {
        console.error('Error actualizando estado:', err.message)
        // Revertir si falla
        setOrders(prev => prev.map(o =>
          o.id === id ? { ...o, status: order.status } : o
        ))
      }
    }
  }

  // ── Cancelar pedido (restaurante puede cancelar pending/preparing) ──
  const cancelOrder = async (id) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o))
    if (API_ENABLED) {
      try { await ordersAPI.cancel(id) }
      catch (err) {
        console.error('Error cancelando pedido:', err.message)
        // Revertir si falla
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: orders.find(x => x.id === id)?.status || 'pending' } : o))
      }
    }
  }

  const filteredOrders = filterStatus === "all"
    ? orders
    : orders.filter(o => o.status === filterStatus)

  const pendingCount = orders.filter(o => o.status === "pending").length
  const activeCount  = orders.filter(o => o.status === "preparing" || o.status === "ready").length

  // ── Menú ─────────────────────────────────────────────────────
  const openNew = () => { setModalForm(BLANK_ITEM); setModalItem("new") }
  const openEdit = (food) => { setModalForm({ name: food.name, price: food.price, image: food.image, popular: food.popular }); setModalItem(food) }

  const saveItem = async () => {
    if (!modalForm.name || !modalForm.price) return
    const restaurantId = myRestaurantId || user?.restaurant_id || user?.restaurantId || 2
    const payload = {
      restaurant_id: restaurantId,
      name:          modalForm.name.trim(),
      price:         Number(modalForm.price),
      image:         modalForm.image || null,
      popular:       modalForm.popular,
    }

    if (modalItem === "new") {
      if (API_ENABLED) {
        try {
          const data = await menuAPI.create(payload)
          const created = data.data
          setMenu(prev => [...prev, {
            id: created.id, restaurantId: created.restaurant_id,
            name: created.name, price: created.price,
            image: created.image, popular: created.popular
          }])
        } catch (err) {
          console.error('Error creando platillo:', err.message)
          return
        }
      } else {
        setMenu(prev => [...prev, { id: Date.now(), restaurantId, ...payload }])
      }
    } else {
      if (API_ENABLED) {
        try {
          await menuAPI.update(modalItem.id, payload)
          setMenu(prev => prev.map(f =>
            f.id === modalItem.id ? { ...f, ...payload, price: Number(modalForm.price) } : f
          ))
        } catch (err) {
          console.error('Error actualizando platillo:', err.message)
          return
        }
      } else {
        setMenu(prev => prev.map(f =>
          f.id === modalItem.id ? { ...f, ...modalForm, price: Number(modalForm.price) } : f
        ))
      }
    }
    setModalItem(null)
  }

  const deleteItem = async (id) => {
    if (API_ENABLED) {
      try {
        await menuAPI.remove(id)
      } catch (err) {
        console.error('Error eliminando platillo:', err.message)
        setDeleteConfirm(null)
        return
      }
    }
    setMenu(prev => prev.filter(f => f.id !== id))
    setDeleteConfirm(null)
  }

  // ── Stats ────────────────────────────────────────────────────
  const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.total, 0)
  const deliveredCount = orders.filter(o => o.status === "delivered").length
  const popularItems = [...menu].sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0)).slice(0, 3)

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={S.layout}>
      <Navbar />
      <div style={S.body}>

        {/* Sidebar */}
        <aside style={S.sidebar} className="qb-dashboard-sidebar">
          <div style={S.sidebarBrand}>
            <div style={S.sidebarAvatar}>{restaurantEmoji}</div>
            <div>
              <p style={S.sidebarName}>{restaurantName}</p>
              <p style={S.sidebarRole}>Panel del restaurante</p>
            </div>
          </div>

          {/* Status dot */}
          <div style={S.statusRow}>
            <div style={S.statusDot} />
            <span style={S.statusText}>Abierto · Acepta pedidos</span>
          </div>

          <nav style={S.nav}>
            {[
              { id: "orders",  icon: "📦", label: "Pedidos",       badge: pendingCount > 0 ? pendingCount : null },
              { id: "menu",    icon: "🍽️", label: "Menú",          badge: null },
              { id: "stats",   icon: "📊", label: "Estadísticas",  badge: null },
            ].map(item => (
              <button key={item.id} onClick={() => setView(item.id)}
                style={{ ...S.navBtn, background: view === item.id ? "rgba(255,112,67,0.18)" : "transparent", color: view === item.id ? "#ff7043" : "rgba(255,255,255,0.55)", borderLeft: view === item.id ? "3px solid #ff7043" : "3px solid transparent" }}
              >
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && <span style={S.navBadge}>{item.badge}</span>}
              </button>
            ))}
          </nav>

          <div style={S.sidebarFooter}>
            <div style={S.quickStat}><span style={S.quickStatNum}>{pendingCount}</span><span style={S.quickStatLabel}>Pendientes</span></div>
            <div style={S.quickStatDivider} />
            <div style={S.quickStat}><span style={S.quickStatNum}>{activeCount}</span><span style={S.quickStatLabel}>En proceso</span></div>
          </div>
        </aside>

        {/* Main */}
        <main style={S.main} className="qb-dashboard-main">

          {/* ── PEDIDOS ── */}
          {view === "orders" && (
            <div>
              <div style={S.pageHeader}>
                <div>
                  <h1 style={S.pageTitle}>Pedidos</h1>
                  <p style={S.pageSubtitle}>{orders.length} pedidos en total hoy</p>
                </div>
                {pendingCount > 0 && (
                  <div style={S.alertBadge}>🔔 {pendingCount} nuevo{pendingCount > 1 ? "s" : ""} pedido{pendingCount > 1 ? "s" : ""}</div>
                )}
              </div>

              {/* Filtros */}
              <div style={S.filterRow}>
                {["all", "pending", "preparing", "ready", "delivered", "cancelled"].map(status => (
                  <button key={status} onClick={() => setFilterStatus(status)}
                    style={{ ...S.filterBtn, background: filterStatus === status ? "var(--brand)" : "var(--surface)", color: filterStatus === status ? "white" : "var(--text-muted)", border: filterStatus === status ? "none" : "1px solid var(--border)" }}
                  >
                    {status === "all" ? "Todos" : STATUS_CONFIG[status].label}
                    <span style={{ ...S.filterCount, background: filterStatus === status ? "rgba(255,255,255,0.25)" : "var(--surface2)" }}>
                      {status === "all" ? orders.length : orders.filter(o => o.status === status).length}
                    </span>
                  </button>
                ))}
                {loadingOrders && (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", alignSelf: "center", marginLeft: "8px" }}>
                    🔄 Actualizando...
                  </span>
                )}
              </div>

              <div style={S.orderList}>
                {filteredOrders.length === 0 && (
                  <div style={S.emptyState}><span style={{ fontSize: "40px" }}>📭</span><p>No hay pedidos en esta categoría</p></div>
                )}
                {filteredOrders.map(order => {
                  const cfg = STATUS_CONFIG[order.status]
                  return (
                    <div key={order.id} style={{ ...S.orderCard, borderLeft: `4px solid ${cfg.color}` }}>
                      <div style={S.orderTop}>
                        <div style={S.orderMeta}>
                          <span style={S.orderId}>#{order.id}</span>
                          <span style={{ ...S.orderStatusBadge, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                          <span style={S.orderTypeBadge}>{order.type === "delivery" ? "🛵 Delivery" : "🏪 Pickup"}</span>
                        </div>
                        <span style={S.orderTime}>{order.time}</span>
                      </div>

                      <div style={S.orderBody} className="qb-order-body">
                        <div style={S.orderInfo}>
                          <p style={S.orderCustomer}>👤 {order.customer}</p>
                          <p style={S.orderAddress}>📍 {order.address}</p>
                          <div style={S.orderItems}>
                            {order.items.map((it, i) => (
                              <span key={i} style={S.orderItemChip}>{it.qty}× {it.name}</span>
                            ))}
                          </div>
                        </div>
                        <div style={S.orderRight} className="qb-order-right">
                          <p style={S.orderTotal}>${order.total} <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--text-muted)" }}>MXN</span></p>
                          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", justifyContent:"flex-end" }}>
                            <button style={S.detailBtn} onClick={() => setSelectedOrder(order)}>
                              🔍 Ver detalle
                            </button>
                            {cfg.next && (
                              <button style={S.advanceBtn} onClick={() => advanceOrder(order.id)}>
                                {cfg.nextLabel}
                              </button>
                            )}
                            {(order.status === 'pending' || order.status === 'preparing') && (
                              <button
                                style={{ ...S.detailBtn, color: 'var(--danger)', borderColor: '#fecaca' }}
                                onClick={() => cancelOrder(order.id)}
                              >
                                ❌ Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── MENÚ ── */}
          {view === "menu" && (
            <div>
              <div style={S.pageHeader}>
                <div>
                  <h1 style={S.pageTitle}>Menú</h1>
                  <p style={S.pageSubtitle}>{menu.length} platillos activos</p>
                </div>
                <button style={S.addBtn} onClick={openNew}>+ Agregar platillo</button>
              </div>

              <div style={S.menuGrid} className="qb-menu-grid">
                {menu.map(food => (
                  <div key={food.id} style={S.menuCard}>
                    <div style={S.menuImgWrapper}>
                      <img src={food.image} alt={food.name} style={S.menuImg} />
                      {food.popular && <span style={S.popularBadge}>⭐ Popular</span>}
                    </div>
                    <div style={S.menuCardBody}>
                      <p style={S.menuName}>{food.name}</p>
                      <p style={S.menuPrice}>${food.price} MXN</p>
                      <div style={S.menuActions}>
                        <button style={S.editMenuBtn} onClick={() => openEdit(food)}>✏️ Editar</button>
                        <button style={S.deleteMenuBtn} onClick={() => setDeleteConfirm(food.id)}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ESTADÍSTICAS ── */}
          {view === "stats" && (
            <div>
              <div style={S.pageHeader}>
                <div>
                  <h1 style={S.pageTitle}>Estadísticas</h1>
                  <p style={S.pageSubtitle}>Resumen del día de hoy</p>
                </div>
              </div>

              {/* KPI Cards */}
              <div style={S.kpiGrid} className="qb-kpi-grid">
                {[
                  { icon: "📦", label: "Pedidos entregados", value: deliveredCount, color: "#22c55e", sub: `de ${orders.length} totales` },
                  { icon: "💰", label: "Ingresos del día", value: `$${totalRevenue}`, color: "#6366f1", sub: "MXN facturado" },
                  { icon: "🍽️", label: "Platillos en menú", value: menu.length, color: "var(--brand)", sub: `${menu.filter(f => f.popular).length} marcados populares` },
                  { icon: "⭐", label: "Rating promedio", value: "4.8", color: "#f59e0b", sub: "Basado en 519 reseñas" },
                ].map((kpi, i) => (
                  <div key={i} style={{ ...S.kpiCard, borderTop: `3px solid ${kpi.color}` }}>
                    <div style={S.kpiIcon}>{kpi.icon}</div>
                    <div style={{ ...S.kpiValue, color: kpi.color }}>{kpi.value}</div>
                    <div style={S.kpiLabel}>{kpi.label}</div>
                    <div style={S.kpiSub}>{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* Estado de pedidos */}
              <div style={S.statsRow} className="qb-stats-row">
                <div style={S.statsCard}>
                  <h3 style={S.statsCardTitle}>Estado de pedidos</h3>
                  <div style={S.statusBars}>
                    {["pending", "preparing", "ready", "delivered"].map(status => {
                      const count = orders.filter(o => o.status === status).length
                      const pct = orders.length ? Math.round((count / orders.length) * 100) : 0
                      const cfg = STATUS_CONFIG[status]
                      return (
                        <div key={status} style={S.statusBarRow}>
                          <div style={S.statusBarLabel}>
                            <span style={{ ...S.statusDotSmall, background: cfg.color }} />
                            <span style={{ fontSize: "13px" }}>{cfg.label}</span>
                          </div>
                          <div style={S.statusBarTrack}>
                            <div style={{ ...S.statusBarFill, width: `${pct}%`, background: cfg.color }} />
                          </div>
                          <span style={S.statusBarCount}>{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={S.statsCard}>
                  <h3 style={S.statsCardTitle}>Platillos más pedidos</h3>
                  <div style={S.topItems}>
                    {menu.slice(0, 5).map((food, i) => (
                      <div key={food.id} style={S.topItemRow}>
                        <span style={S.topItemRank}>#{i + 1}</span>
                        <img src={food.image} alt={food.name} style={S.topItemImg} />
                        <div style={{ flex: 1 }}>
                          <p style={S.topItemName}>{food.name}</p>
                          <p style={S.topItemPrice}>${food.price} MXN</p>
                        </div>
                        {food.popular && <span style={S.popularTag}>⭐ Popular</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tipos de entrega */}
              <div style={S.statsCard}>
                <h3 style={S.statsCardTitle}>Tipos de entrega hoy</h3>
                <div style={S.deliveryTypeStats}>
                  {[
                    { type: "delivery", icon: "🛵", label: "A domicilio", count: orders.filter(o => o.type === "delivery").length },
                    { type: "pickup",   icon: "🏪", label: "Pickup en sucursal", count: orders.filter(o => o.type === "pickup").length },
                  ].map(dt => {
                    const pct = orders.length ? Math.round((dt.count / orders.length) * 100) : 0
                    return (
                      <div key={dt.type} style={S.deliveryTypeStat}>
                        <span style={{ fontSize: "28px" }}>{dt.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={S.deliveryTypeHeader}>
                            <span style={S.deliveryTypeLabel}>{dt.label}</span>
                            <span style={S.deliveryTypeCount}>{dt.count} pedidos · {pct}%</span>
                          </div>
                          <div style={S.deliveryTypeTrack}>
                            <div style={{ ...S.deliveryTypeFill, width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Modal detalle de pedido ── */}
      {selectedOrder && (
        <div style={S.modalBackdrop} onClick={e => e.target === e.currentTarget && setSelectedOrder(null)}>
          <div style={{ ...S.modal, maxWidth: "560px" }}>
            <div style={S.modalHeader}>
              <div>
                <h2 style={S.modalTitle}>Pedido #{selectedOrder.id}</h2>
                <div style={{ display:"flex", gap:"8px", marginTop:"6px" }}>
                  <span style={{ ...S.orderStatusBadge, background: STATUS_CONFIG[selectedOrder.status].bg, color: STATUS_CONFIG[selectedOrder.status].color }}>
                    {STATUS_CONFIG[selectedOrder.status].label}
                  </span>
                  <span style={S.orderTypeBadge}>{selectedOrder.type === "delivery" ? "🛵 Delivery" : "🏪 Pickup"}</span>
                </div>
              </div>
              <button style={S.modalClose} onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div style={{ ...S.modalBody, maxHeight: "70vh", overflowY: "auto" }}>
              {/* Info del cliente */}
              <div style={S.detailSection}>
                <p style={S.detailSectionTitle}>👤 Información del cliente</p>
                <div style={S.detailGrid}>
                  <div><span style={S.detailLabel}>Nombre</span><p style={S.detailValue}>{selectedOrder.customer}</p></div>
                  <div><span style={S.detailLabel}>Teléfono</span><p style={S.detailValue}>{selectedOrder.phone}</p></div>
                  <div style={{ gridColumn:"1/-1" }}><span style={S.detailLabel}>{selectedOrder.type === "pickup" ? "Recoger en" : "Dirección"}</span><p style={S.detailValue}>{selectedOrder.address}</p></div>
                  <div><span style={S.detailLabel}>Pago</span><p style={S.detailValue}>{selectedOrder.payMethod === "efectivo" ? "💵 Efectivo" : "💳 Tarjeta"}</p></div>
                  <div><span style={S.detailLabel}>Hora</span><p style={S.detailValue}>{selectedOrder.time}</p></div>
                </div>
              </div>

              {/* Productos con personalización */}
              <div style={S.detailSection}>
                <p style={S.detailSectionTitle}>🛒 Productos del pedido</p>
                <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} style={S.detailItemCard}>
                      <div style={S.detailItemHeader}>
                        <span style={S.detailItemQty}>{item.qty}×</span>
                        <span style={S.detailItemName}>{item.name}</span>
                        <span style={S.detailItemPrice}>${item.price * item.qty} MXN</span>
                      </div>

                      {/* Extras */}
                      {item.extras && item.extras.length > 0 && (
                        <div style={S.detailCustomRow}>
                          <span style={{ ...S.detailCustomBadge, background:"#dcfce7", color:"#166534" }}>➕ Extras</span>
                          <span style={S.detailCustomText}>{item.extras.join(", ")}</span>
                        </div>
                      )}

                      {/* Sin ingredientes */}
                      {item.removed && item.removed.length > 0 && (
                        <div style={S.detailCustomRow}>
                          <span style={{ ...S.detailCustomBadge, background:"#fee2e2", color:"#dc2626" }}>🚫 Sin</span>
                          <span style={S.detailCustomText}>{item.removed.join(", ")}</span>
                        </div>
                      )}

                      {/* Picante */}
                      {item.spicy && item.spicy !== "normal" && (
                        <div style={S.detailCustomRow}>
                          <span style={{ ...S.detailCustomBadge, background:"#fef9c3", color:"#854d0e" }}>
                            {item.spicy === "sin" ? "😌 Sin picante" : "🔥 Extra picante"}
                          </span>
                        </div>
                      )}

                      {/* Comentarios */}
                      {item.comments && (
                        <div style={S.detailCustomRow}>
                          <span style={{ ...S.detailCustomBadge, background:"#e0f2fe", color:"#0369a1" }}>💬 Nota</span>
                          <span style={{ ...S.detailCustomText, fontStyle:"italic" }}>"{item.comments}"</span>
                        </div>
                      )}

                      {/* Sin personalización */}
                      {!item.extras?.length && !item.removed?.length && item.spicy === "normal" && !item.comments && (
                        <p style={{ fontSize:"12px", color:"var(--text-muted)", marginTop:"6px" }}>Sin personalizaciones</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div style={{ background:"var(--surface2)", borderRadius:"var(--radius-sm)", padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontWeight:600, fontSize:"14px" }}>Total del pedido</span>
                <span style={{ fontFamily:"var(--font-display)", fontSize:"20px", fontWeight:800, color:"var(--brand)" }}>${selectedOrder.total} MXN</span>
              </div>
            </div>

            <div style={S.modalFooter}>
              <button style={S.modalCancel} onClick={() => setSelectedOrder(null)}>Cerrar</button>
              {STATUS_CONFIG[selectedOrder.status].next && (
                <button style={S.modalSave} onClick={() => { advanceOrder(selectedOrder.id); setSelectedOrder(null) }}>
                  {STATUS_CONFIG[selectedOrder.status].nextLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal menú ── */}
      {modalItem !== null && (
        <div style={S.modalBackdrop} onClick={e => e.target === e.currentTarget && setModalItem(null)}>
          <div style={S.modal}>
            <div style={S.modalHeader}>
              <h2 style={S.modalTitle}>{modalItem === "new" ? "Agregar platillo" : "Editar platillo"}</h2>
              <button style={S.modalClose} onClick={() => setModalItem(null)}>✕</button>
            </div>
            <div style={S.modalBody}>
              {[
                { label: "Nombre del platillo *", name: "name", placeholder: "Ej: Hamburguesa Doble" },
                { label: "Precio (MXN) *", name: "price", placeholder: "Ej: 150", type: "number" },
                { label: "URL de imagen", name: "image", placeholder: "https://..." },
              ].map(f => (
                <div key={f.name} style={S.modalField}>
                  <label style={S.modalLabel}>{f.label}</label>
                  <input style={S.modalInput} type={f.type || "text"} placeholder={f.placeholder}
                    value={modalForm[f.name]} onChange={e => setModalForm(prev => ({ ...prev, [f.name]: e.target.value }))} />
                </div>
              ))}
              <div style={S.modalField}>
                <label style={S.modalCheckRow}>
                  <input type="checkbox" checked={modalForm.popular} onChange={e => setModalForm(prev => ({ ...prev, popular: e.target.checked }))} />
                  <span style={S.modalLabel}>Marcar como platillo popular ⭐</span>
                </label>
              </div>
              {modalForm.image && (
                <img src={modalForm.image} alt="preview" style={S.modalPreview} onError={e => e.target.style.display = "none"} />
              )}
            </div>
            <div style={S.modalFooter}>
              <button style={S.modalCancel} onClick={() => setModalItem(null)}>Cancelar</button>
              <button style={{ ...S.modalSave, opacity: (modalForm.name && modalForm.price) ? 1 : 0.5 }}
                onClick={saveItem} disabled={!modalForm.name || !modalForm.price}>
                {modalItem === "new" ? "Agregar al menú" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete ── */}
      {deleteConfirm && (
        <div style={S.modalBackdrop} onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div style={{ ...S.modal, maxWidth: "400px" }}>
            <div style={S.modalBody}>
              <div style={{ textAlign: "center", padding: "12px 0 20px" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🗑️</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>¿Eliminar platillo?</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div style={S.modalFooter}>
              <button style={S.modalCancel} onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button style={{ ...S.modalSave, background: "#dc2626" }} onClick={() => deleteItem(deleteConfirm)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const S = {
  layout: { minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" },
  body: { display: "flex", flex: 1 },

  // Sidebar
  sidebar: { width: "280px", background: "#111827", display: "flex", flexDirection: "column", padding: "28px 18px 24px", gap: "24px", flexShrink: 0 },
  sidebarBrand: { display: "flex", alignItems: "center", gap: "14px", paddingBottom: "22px", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  sidebarAvatar: { width: "52px", height: "52px", background: "rgba(255,112,67,0.2)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0 },
  sidebarName: { color: "white", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--fs-md)" },
  sidebarRole: { color: "rgba(255,255,255,0.5)", fontSize: "var(--fs-xs)", marginTop: "3px" },
  statusRow: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "rgba(34,197,94,0.1)", borderRadius: "10px", border: "1px solid rgba(34,197,94,0.2)" },
  statusDot: { width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", flexShrink: 0, boxShadow: "0 0 6px #22c55e" },
  statusText: { fontSize: "var(--fs-sm)", color: "#86efac", fontWeight: 500 },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navBtn: { display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "var(--fs-base)", fontWeight: 500, fontFamily: "var(--font-body)", transition: "all 0.15s", textAlign: "left", minHeight: "var(--touch-min)" },
  navBadge: { background: "#ef4444", color: "white", fontSize: "var(--fs-xs)", fontWeight: 800, padding: "3px 9px", borderRadius: "100px", minWidth: "22px", textAlign: "center" },
  sidebarFooter: { display: "flex", gap: "0", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "20px" },
  quickStat: { flex: 1, textAlign: "center" },
  quickStatNum: { display: "block", fontFamily: "var(--font-display)", fontSize: "var(--fs-xl)", fontWeight: 800, color: "white" },
  quickStatLabel: { fontSize: "var(--fs-xs)", color: "rgba(255,255,255,0.45)" },
  quickStatDivider: { width: "1px", background: "rgba(255,255,255,0.08)", margin: "0 10px" },

  // Main
  main: { flex: 1, padding: "40px 44px", overflowY: "auto" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "12px" },
  pageTitle: { fontFamily: "var(--font-display)", fontSize: "var(--fs-2xl)", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "6px" },
  pageSubtitle: { color: "var(--text-muted)", fontSize: "var(--fs-base)" },
  alertBadge: { background: "#fef3c7", border: "2px solid #fcd34d", color: "#92400e", padding: "10px 20px", borderRadius: "100px", fontSize: "var(--fs-base)", fontWeight: 700, animation: "pulse 2s ease-in-out infinite" },

  // Filtros
  filterRow: { display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" },
  filterBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "100px", cursor: "pointer", fontSize: "var(--fs-sm)", fontWeight: 600, fontFamily: "var(--font-body)", transition: "all 0.2s", minHeight: "var(--touch-min)" },
  filterCount: { fontSize: "var(--fs-xs)", fontWeight: 700, padding: "2px 9px", borderRadius: "100px" },

  // Pedidos
  orderList: { display: "flex", flexDirection: "column", gap: "14px" },
  orderCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 24px", boxShadow: "var(--shadow-sm)", transition: "box-shadow 0.2s" },
  orderTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" },
  orderMeta: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  orderId: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-md)" },
  orderStatusBadge: { padding: "5px 14px", borderRadius: "100px", fontSize: "var(--fs-sm)", fontWeight: 700 },
  orderTypeBadge: { padding: "5px 12px", borderRadius: "100px", fontSize: "var(--fs-sm)", fontWeight: 600, background: "var(--surface2)", color: "var(--text-muted)", border: "1px solid var(--border)" },
  orderTime: { fontSize: "var(--fs-sm)", color: "var(--text-muted)" },
  orderBody: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "20px", flexWrap: "wrap" },
  orderInfo: { flex: 1, minWidth: 0 },
  orderCustomer: { fontSize: "var(--fs-base)", fontWeight: 600, marginBottom: "6px" },
  orderAddress: { fontSize: "var(--fs-sm)", color: "var(--text-muted)", marginBottom: "10px" },
  orderItems: { display: "flex", flexWrap: "wrap", gap: "8px" },
  orderItemChip: { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "100px", padding: "5px 12px", fontSize: "var(--fs-sm)", color: "var(--text)" },
  orderRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px", flexShrink: 0 },
  orderTotal: { fontFamily: "var(--font-display)", fontSize: "var(--fs-2xl)", fontWeight: 800 },
  advanceBtn: { background: "var(--brand)", color: "white", border: "none", padding: "12px 22px", borderRadius: "var(--radius-sm)", fontSize: "var(--fs-base)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap", minHeight: "var(--touch-min)" },
  detailBtn: { background: "var(--surface2)", color: "var(--text)", border: "2px solid var(--border)", padding: "10px 18px", borderRadius: "var(--radius-sm)", fontSize: "var(--fs-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap", minHeight: "var(--touch-min)" },
  detailSection: { marginBottom: "24px" },
  detailSectionTitle: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--fs-sm)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px" },
  detailGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  detailLabel: { fontSize: "var(--fs-xs)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: "3px" },
  detailValue: { fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--text)" },
  detailItemCard: { background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "16px", border: "1px solid var(--border)" },
  detailItemHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" },
  detailItemQty: { width: "32px", height: "32px", borderRadius: "50%", background: "var(--brand)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-base)", fontWeight: 800, flexShrink: 0 },
  detailItemName: { flex: 1, fontWeight: 700, fontSize: "var(--fs-base)", fontFamily: "var(--font-display)" },
  detailItemPrice: { fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--brand)", flexShrink: 0 },
  detailCustomRow: { display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "8px" },
  detailCustomBadge: { fontSize: "var(--fs-xs)", fontWeight: 700, padding: "3px 10px", borderRadius: "100px", flexShrink: 0, whiteSpace: "nowrap" },
  detailCustomText: { fontSize: "var(--fs-sm)", color: "var(--text)", lineHeight: 1.4 },
  emptyState: { textAlign: "center", padding: "72px", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" },

  // Menú
  addBtn: { background: "var(--brand)", color: "white", border: "none", padding: "12px 26px", borderRadius: "var(--radius-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "var(--fs-base)", minHeight: "var(--touch-min)" },
  menuGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" },
  menuCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-sm)", transition: "box-shadow 0.2s" },
  menuImgWrapper: { position: "relative", height: "170px", overflow: "hidden" },
  menuImg: { width: "100%", height: "100%", objectFit: "cover" },
  popularBadge: { position: "absolute", top: "10px", left: "10px", background: "#fef9c3", color: "#854d0e", fontSize: "var(--fs-sm)", fontWeight: 700, padding: "4px 10px", borderRadius: "100px" },
  menuCardBody: { padding: "18px" },
  menuName: { fontWeight: 700, fontSize: "var(--fs-base)", marginBottom: "6px", fontFamily: "var(--font-display)" },
  menuPrice: { color: "var(--brand)", fontWeight: 800, fontSize: "var(--fs-md)", marginBottom: "16px" },
  menuActions: { display: "flex", gap: "10px" },
  editMenuBtn: { flex: 1, padding: "10px", border: "2px solid var(--border)", borderRadius: "var(--radius-sm)", background: "transparent", cursor: "pointer", fontSize: "var(--fs-sm)", fontFamily: "var(--font-body)", fontWeight: 600, minHeight: "var(--touch-min)" },
  deleteMenuBtn: { padding: "10px 14px", border: "2px solid #fecaca", borderRadius: "var(--radius-sm)", background: "#fef2f2", color: "var(--danger)", cursor: "pointer", fontSize: "var(--fs-sm)", fontFamily: "var(--font-body)", fontWeight: 600, minHeight: "var(--touch-min)" },

  // Stats
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px", marginBottom: "28px" },
  kpiCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "26px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", boxShadow: "var(--shadow-sm)" },
  kpiIcon: { fontSize: "34px", marginBottom: "6px" },
  kpiValue: { fontFamily: "var(--font-display)", fontSize: "var(--fs-2xl)", fontWeight: 800 },
  kpiLabel: { fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--text)" },
  kpiSub: { fontSize: "var(--fs-sm)", color: "var(--text-muted)" },
  statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "18px" },
  statsCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "26px", boxShadow: "var(--shadow-sm)", marginBottom: "18px" },
  statsCardTitle: { fontFamily: "var(--font-display)", fontSize: "var(--fs-md)", fontWeight: 800, marginBottom: "20px", letterSpacing: "-0.3px" },
  statusBars: { display: "flex", flexDirection: "column", gap: "14px" },
  statusBarRow: { display: "flex", alignItems: "center", gap: "12px" },
  statusBarLabel: { display: "flex", alignItems: "center", gap: "9px", minWidth: "140px" },
  statusDotSmall: { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 },
  statusBarTrack: { flex: 1, height: "10px", background: "var(--surface2)", borderRadius: "100px", overflow: "hidden" },
  statusBarFill: { height: "100%", borderRadius: "100px", transition: "width 0.5s ease" },
  statusBarCount: { fontSize: "var(--fs-base)", fontWeight: 700, minWidth: "26px", textAlign: "right" },
  topItems: { display: "flex", flexDirection: "column", gap: "12px" },
  topItemRow: { display: "flex", alignItems: "center", gap: "12px" },
  topItemRank: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-base)", color: "var(--text-muted)", minWidth: "26px" },
  topItemImg: { width: "44px", height: "44px", borderRadius: "10px", objectFit: "cover" },
  topItemName: { fontSize: "var(--fs-base)", fontWeight: 600 },
  topItemPrice: { fontSize: "var(--fs-sm)", color: "var(--text-muted)" },
  popularTag: { fontSize: "var(--fs-xs)", background: "#fef9c3", color: "#854d0e", padding: "3px 10px", borderRadius: "100px", fontWeight: 600, flexShrink: 0 },
  deliveryTypeStats: { display: "flex", flexDirection: "column", gap: "20px" },
  deliveryTypeStat: { display: "flex", alignItems: "center", gap: "18px" },
  deliveryTypeHeader: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
  deliveryTypeLabel: { fontSize: "var(--fs-base)", fontWeight: 600 },
  deliveryTypeCount: { fontSize: "var(--fs-sm)", color: "var(--text-muted)" },
  deliveryTypeTrack: { height: "12px", background: "var(--surface2)", borderRadius: "100px", overflow: "hidden" },
  deliveryTypeFill: { height: "100%", background: "var(--brand)", borderRadius: "100px", transition: "width 0.5s ease" },

  // Modal
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(4px)" },
  modal: { background: "var(--surface)", borderRadius: "var(--radius)", width: "100%", maxWidth: "560px", boxShadow: "var(--shadow-lg)", overflow: "hidden", maxHeight: "92vh", display: "flex", flexDirection: "column" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 28px", borderBottom: "1px solid var(--border)" },
  modalTitle: { fontFamily: "var(--font-display)", fontSize: "var(--fs-xl)", fontWeight: 800 },
  modalClose: { background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-muted)", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontFamily: "var(--font-body)" },
  modalBody: { padding: "24px 28px", display: "flex", flexDirection: "column", gap: "18px", overflowY: "auto" },
  modalField: { display: "flex", flexDirection: "column", gap: "6px" },
  modalLabel: { fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--text)" },
  modalInput: { padding: "14px 18px", border: "2px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "var(--fs-base)", fontFamily: "var(--font-body)", background: "var(--surface2)", color: "var(--text)", outline: "none", minHeight: "var(--touch-min)" },
  modalCheckRow: { display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "var(--fs-base)" },
  modalPreview: { width: "100%", height: "160px", objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" },
  modalFooter: { display: "flex", gap: "12px", padding: "20px 28px", borderTop: "1px solid var(--border)" },
  modalCancel: { flex: 1, padding: "14px", border: "2px solid var(--border)", borderRadius: "var(--radius-sm)", background: "transparent", cursor: "pointer", fontWeight: 600, fontFamily: "var(--font-body)", fontSize: "var(--fs-base)", minHeight: "var(--touch-min)" },
  modalSave: { flex: 1, padding: "14px", background: "var(--brand)", color: "white", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)", fontSize: "var(--fs-base)", transition: "opacity 0.2s", minHeight: "var(--touch-min)" },
}
