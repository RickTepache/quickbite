import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import { FieldError, inputStyle } from "../components/FieldError"
import {
  restaurantsAPI,
  ordersAPI,
  usersAPI,
  menuAPI,
  extractList,
  extractData
} from "../../infrastructure/api/api"
import {
  validateRestaurantName,
  validateCategory,
  validateRating,
  validateDeliveryTime,
  validateImageUrl,
  validatePrice,
  validateAll
} from "../../utils/validators"
import { restaurants as mockRestaurants, foods as mockFoods, orders as mockOrders } from "../../data/mockData"

const API_ENABLED = import.meta.env.VITE_USE_BACKEND === 'true'

const CATEGORIES = ["Pizza", "Hamburguesas", "Tacos", "Sushi", "Postres", "Bebidas", "Otro"]

const STATUS_LABELS = {
  pending:   { label: "⏳ Pendiente",  bg: "#fef9c3", color: "#854d0e" },
  preparing: { label: "👨‍🍳 Preparando", bg: "#dbeafe", color: "#1e40af" },
  ready:     { label: "✅ Listo",       bg: "#ede9fe", color: "#6b21a8" },
  delivered: { label: "🎉 Entregado",   bg: "#dcfce7", color: "#166534" },
  cancelled: { label: "❌ Cancelado",   bg: "#fee2e2", color: "#991b1b" },
}

const BLANK_RESTAURANT = {
  name: "",
  category: "Pizza",
  rating: "4.5",
  deliveryTime: "20-30 min",
  minOrder: "100",
  image: "",
  badge: "",
  address: "",
  hours: "Lun–Dom · 12:00 pm – 11:00 pm",
  pickupTime: "10-15 min"
}

function AdminDashboard() {
  const [view, setView] = useState("overview")  // overview | restaurants | orders | users
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")

  // Datos
  const [restaurants, setRestaurants] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [allMenuItems, setAllMenuItems] = useState([])

  // Modales
  const [restaurantModal, setRestaurantModal] = useState(null)  // null | "new" | restaurantObject
  const [restaurantForm, setRestaurantForm] = useState(BLANK_RESTAURANT)
  const [restaurantErrors, setRestaurantErrors] = useState({})
  const [savingRestaurant, setSavingRestaurant] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)  // { type: 'restaurant'|'user', id, name }

  // ── Cargar todo ──────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true)
    setErrorMsg("")
    try {
      if (API_ENABLED) {
        const [rRes, oRes, uRes] = await Promise.allSettled([
          restaurantsAPI.getAll(),
          ordersAPI.getAll(),
          usersAPI.getAll(),
        ])

        if (rRes.status === "fulfilled") {
          setRestaurants(extractList(rRes.value, mockRestaurants))
        } else {
          console.warn("Restaurantes:", rRes.reason?.message)
          setRestaurants(mockRestaurants)
        }

        if (oRes.status === "fulfilled") {
          setOrders(extractList(oRes.value, []))
        } else {
          // Si /orders no existe en el back, hacemos fallback a mock para no romper la vista
          console.warn("Pedidos (admin):", oRes.reason?.message)
          setOrders(mockOrders)
        }

        if (uRes.status === "fulfilled") {
          setUsers(extractList(uRes.value, []))
        } else {
          console.warn("Usuarios:", uRes.reason?.message)
          setUsers([])
        }

        // Cargar todos los items de menú de todos los restaurantes (para KPI)
        try {
          const restaurantList = rRes.status === "fulfilled" ? (rRes.value.data || rRes.value || []) : []
          const menuPromises = restaurantList.map(r => menuAPI.getByRestaurant(r.id).catch(() => ({ data: [] })))
          const menuResults = await Promise.all(menuPromises)
          const allItems = menuResults.flatMap(m => extractList(m, []))
          setAllMenuItems(allItems.length > 0 ? allItems : mockFoods)
        } catch {
          setAllMenuItems(mockFoods)
        }
      } else {
        // Modo mock
        setRestaurants(mockRestaurants)
        setOrders(mockOrders)
        setUsers([])
        setAllMenuItems(mockFoods)
      }
    } catch (err) {
      setErrorMsg(err.message || "Error al cargar datos")
      // Fallback a mock para que el panel no quede inservible
      setRestaurants(mockRestaurants)
      setOrders(mockOrders)
      setUsers([])
      setAllMenuItems(mockFoods)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  // ── KPIs ─────────────────────────────────────────────────────
  const totalRevenue = orders
    .filter(o => o.status === "delivered")
    .reduce((s, o) => s + Number(o.total || 0), 0)
  const customerCount = users.filter(u => u.role === "customer").length

  // ── CRUD Restaurantes ────────────────────────────────────────
  const openNewRestaurant = () => {
    setRestaurantForm(BLANK_RESTAURANT)
    setRestaurantErrors({})
    setRestaurantModal("new")
  }

  const openEditRestaurant = (r) => {
    setRestaurantForm({
      name: r.name || "",
      category: r.category || "Pizza",
      rating: String(r.rating ?? "4.5"),
      deliveryTime: r.deliveryTime || r.delivery_time || "20-30 min",
      minOrder: String(r.minOrder ?? r.min_order ?? "100"),
      image: r.image || "",
      badge: r.badge || "",
      address: r.address || "",
      hours: r.hours || "Lun–Dom · 12:00 pm – 11:00 pm",
      pickupTime: r.pickupTime || r.pickup_time || "10-15 min",
    })
    setRestaurantErrors({})
    setRestaurantModal(r)
  }

  const validateRestaurantForm = () => {
    const checks = {
      name:         validateRestaurantName(restaurantForm.name),
      category:     validateCategory(restaurantForm.category),
      rating:       validateRating(restaurantForm.rating),
      deliveryTime: validateDeliveryTime(restaurantForm.deliveryTime),
      minOrder:     validatePrice(restaurantForm.minOrder),
      image:        validateImageUrl(restaurantForm.image),
    }
    const { isValid, errors } = validateAll(checks)
    setRestaurantErrors(errors)
    return isValid
  }

  const saveRestaurant = async () => {
    if (!validateRestaurantForm()) return
    setSavingRestaurant(true)

    const payload = {
      name:          restaurantForm.name.trim(),
      category:      restaurantForm.category,
      rating:        Number(restaurantForm.rating),
      deliveryTime:  restaurantForm.deliveryTime.trim(),
      delivery_time: restaurantForm.deliveryTime.trim(),  // por si el back usa snake_case
      minOrder:      Number(restaurantForm.minOrder),
      min_order:     Number(restaurantForm.minOrder),
      image:         restaurantForm.image.trim() || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
      badge:         restaurantForm.badge.trim() || null,
      address:       restaurantForm.address.trim(),
      hours:         restaurantForm.hours.trim(),
      pickupTime:    restaurantForm.pickupTime.trim(),
      pickup_time:   restaurantForm.pickupTime.trim(),
    }

    try {
      if (restaurantModal === "new") {
        if (API_ENABLED) {
          const data = await restaurantsAPI.create(payload)
          const created = extractData(data) || { ...payload, id: Date.now() }
          setRestaurants(prev => [...prev, created])
        } else {
          const tempId = Date.now()
          setRestaurants(prev => [...prev, { ...payload, id: tempId }])
        }
      } else {
        const id = restaurantModal.id
        if (API_ENABLED) {
          const data = await restaurantsAPI.update(id, payload)
          const updated = extractData(data) || payload
          setRestaurants(prev => prev.map(r => r.id === id ? { ...r, ...updated, ...payload } : r))
        } else {
          setRestaurants(prev => prev.map(r => r.id === id ? { ...r, ...payload } : r))
        }
      }
      setRestaurantModal(null)
    } catch (err) {
      setRestaurantErrors({ _form: err.message || "Error al guardar el restaurante" })
    } finally {
      setSavingRestaurant(false)
    }
  }

  const deleteRestaurant = async (id) => {
    try {
      if (API_ENABLED) await restaurantsAPI.remove(id)
      setRestaurants(prev => prev.filter(r => r.id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      setErrorMsg(err.message || "Error al eliminar")
      setDeleteConfirm(null)
    }
  }

  const deleteUser = async (id) => {
    try {
      if (API_ENABLED) await usersAPI.remove(id)
      setUsers(prev => prev.filter(u => u.id !== id))
      setDeleteConfirm(null)
    } catch (err) {
      setErrorMsg(err.message || "Error al eliminar usuario")
      setDeleteConfirm(null)
    }
  }

  // ── Cancelar pedido (admin puede cancelar cualquiera pendiente/preparando) ──
  const cancelOrderAdmin = async (id) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o))
    if (API_ENABLED) {
      try { await ordersAPI.cancel(id) }
      catch (err) {
        console.error('Error cancelando pedido:', err.message)
        setErrorMsg(err.message || "No se pudo cancelar el pedido")
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'pending' } : o))
      }
    }
  }

  // ── Render ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={S.loadingState} role="status" aria-live="polite">
          <div style={S.spinner} aria-hidden="true" />
          <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-md)" }}>Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />

      <div style={S.layout}>
        {/* Sidebar */}
        <aside style={S.sidebar} className="qb-dashboard-sidebar" aria-label="Navegación del panel">
          <div style={S.sidebarHeader}>
            <span style={{ fontSize: "32px" }} aria-hidden="true">⚙️</span>
            <span style={S.sidebarTitle} className="qb-dashboard-sidebar-text">Admin</span>
          </div>
          <nav style={S.sidebarNav}>
            {[
              { id: "overview",    icon: "📊", label: "Resumen" },
              { id: "restaurants", icon: "🏪", label: "Restaurantes" },
              { id: "orders",      icon: "📦", label: "Pedidos" },
              { id: "users",       icon: "👥", label: "Usuarios" },
            ].map(item => (
              <button
                key={item.id}
                style={{
                  ...S.sidebarItem,
                  background: view === item.id ? "var(--brand-light)" : "transparent",
                  color: view === item.id ? "var(--brand)" : "var(--text)",
                  fontWeight: view === item.id ? 700 : 500,
                }}
                onClick={() => setView(item.id)}
                aria-current={view === item.id}
              >
                <span style={S.sidebarIcon} aria-hidden="true">{item.icon}</span>
                <span className="qb-dashboard-sidebar-text">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main style={S.main} className="qb-dashboard-main">
          {errorMsg && (
            <div style={S.errorBanner} role="alert">
              <span aria-hidden="true">⚠️</span> {errorMsg}
              <button onClick={() => setErrorMsg("")} style={S.errorClose} aria-label="Cerrar">✕</button>
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {view === "overview" && (
            <>
              <div style={S.pageHeader}>
                <div>
                  <h1 style={S.title}>Panel de Administración</h1>
                  <p style={S.subtitle}>Resumen general de QuickBite</p>
                </div>
                <button onClick={loadAll} style={S.refreshBtn}>
                  <span aria-hidden="true">🔄</span> Actualizar
                </button>
              </div>

              <div style={S.kpiGrid} className="qb-kpi-grid">
                <KPICard icon="🏪" label="Restaurantes" value={restaurants.length} color="#6366f1" />
                <KPICard icon="📦" label="Pedidos totales" value={orders.length} color="var(--brand)" />
                <KPICard icon="🍽️" label="Platillos" value={allMenuItems.length} color="#22c55e" />
                <KPICard icon="💰" label="Ingresos entregados" value={`$${totalRevenue.toLocaleString()}`} color="#f59e0b" />
                <KPICard icon="👥" label="Clientes registrados" value={customerCount} color="#3b82f6" />
                <KPICard icon="✅" label="Pedidos entregados" value={orders.filter(o => o.status === "delivered").length} color="#15803d" />
              </div>

              <div style={S.section}>
                <h2 style={S.sectionTitle}>Pedidos recientes</h2>
                <div style={S.orderList}>
                  {orders.slice(0, 5).map(order => {
                    const cfg = STATUS_LABELS[order.status] || STATUS_LABELS.pending
                    const items = order.items
                      ? (Array.isArray(order.items)
                          ? order.items.map(i => i.name || i).join(", ")
                          : order.items)
                      : "—"
                    return (
                      <div key={order.id} style={S.orderCard}>
                        <div>
                          <p style={S.orderId}>Pedido #{order.id}</p>
                          <p style={S.orderItems}>{items}</p>
                        </div>
                        <div style={S.orderRight}>
                          <span style={{ ...S.statusBadge, background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                          <p style={S.orderTotal}>${order.total} MXN</p>
                        </div>
                      </div>
                    )
                  })}
                  {orders.length === 0 && (
                    <p style={S.emptyText}>Aún no hay pedidos en el sistema.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── RESTAURANTS ── */}
          {view === "restaurants" && (
            <>
              <div style={S.pageHeader}>
                <div>
                  <h1 style={S.title}>Restaurantes</h1>
                  <p style={S.subtitle}>{restaurants.length} restaurante(s) registrados</p>
                </div>
                <button onClick={openNewRestaurant} style={S.primaryBtn}>
                  <span aria-hidden="true">+</span> Agregar restaurante
                </button>
              </div>

              {restaurants.length === 0 ? (
                <div style={S.emptyState}>
                  <div style={{ fontSize: "64px", marginBottom: "16px" }} aria-hidden="true">🏪</div>
                  <p style={S.emptyTitle}>No hay restaurantes</p>
                  <p style={S.emptyText}>Agrega el primer restaurante para empezar.</p>
                </div>
              ) : (
                <div style={S.restaurantGrid}>
                  {restaurants.map(r => (
                    <div key={r.id} style={S.restaurantCard}>
                      <div style={S.restaurantImgWrap}>
                        <img src={r.image} alt="" style={S.restaurantImg} />
                        {r.badge && <span style={S.restaurantBadge}>{r.badge}</span>}
                      </div>
                      <div style={S.restaurantBody}>
                        <h3 style={S.restaurantName}>{r.name}</h3>
                        <div style={S.restaurantMeta}>
                          <span style={S.metaChip}>{r.category}</span>
                          <span style={S.metaChip}>⭐ {r.rating}</span>
                          <span style={S.metaChip}>⏱ {r.deliveryTime || r.delivery_time}</span>
                        </div>
                        {r.address && <p style={S.restaurantAddr}>📍 {r.address}</p>}
                        <div style={S.restaurantActions}>
                          <button style={S.editBtn} onClick={() => openEditRestaurant(r)}>
                            ✏️ Editar
                          </button>
                          <button style={S.deleteBtn} onClick={() => setDeleteConfirm({ type: "restaurant", id: r.id, name: r.name })}>
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── ORDERS ── */}
          {view === "orders" && (
            <>
              <div style={S.pageHeader}>
                <div>
                  <h1 style={S.title}>Todos los pedidos</h1>
                  <p style={S.subtitle}>{orders.length} pedido(s) en el sistema</p>
                </div>
                <button onClick={loadAll} style={S.refreshBtn}>
                  <span aria-hidden="true">🔄</span> Actualizar
                </button>
              </div>

              {orders.length === 0 ? (
                <div style={S.emptyState}>
                  <div style={{ fontSize: "64px", marginBottom: "16px" }} aria-hidden="true">📦</div>
                  <p style={S.emptyTitle}>Sin pedidos aún</p>
                </div>
              ) : (
                <div style={S.orderList}>
                  {orders.map(order => {
                    const cfg = STATUS_LABELS[order.status] || STATUS_LABELS.pending
                    const items = order.items
                      ? (Array.isArray(order.items)
                          ? order.items.map(i => `${i.quantity || 1}× ${i.name || i}`).join(", ")
                          : order.items)
                      : "—"
                    return (
                      <div key={order.id} style={S.orderCard}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={S.orderId}>Pedido #{order.id}</p>
                          {order.customer_name && <p style={S.orderCustomer}>👤 {order.customer_name}</p>}
                          <p style={S.orderItems}>{items}</p>
                        </div>
                        <div style={S.orderRight}>
                          <span style={{ ...S.statusBadge, background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                          <p style={S.orderTotal}>${order.total} MXN</p>
                          {(order.status === 'pending' || order.status === 'preparing') && (
                            <button
                              style={{ ...S.deleteBtnSmall, marginTop: "4px" }}
                              onClick={() => cancelOrderAdmin(order.id)}
                              title="Cancelar pedido"
                            >
                              ❌ Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ── USERS ── */}
          {view === "users" && (
            <>
              <div style={S.pageHeader}>
                <div>
                  <h1 style={S.title}>Usuarios registrados</h1>
                  <p style={S.subtitle}>{users.length} usuario(s) en el sistema</p>
                </div>
                <button onClick={loadAll} style={S.refreshBtn}>
                  <span aria-hidden="true">🔄</span> Actualizar
                </button>
              </div>

              {users.length === 0 ? (
                <div style={S.emptyState}>
                  <div style={{ fontSize: "64px", marginBottom: "16px" }} aria-hidden="true">👥</div>
                  <p style={S.emptyTitle}>No se pudieron cargar los usuarios</p>
                  <p style={S.emptyText}>El endpoint /users puede no estar disponible en el backend, o no tienes permisos.</p>
                </div>
              ) : (
                <div style={S.userTable}>
                  <div style={S.userTableHeader}>
                    <span style={{ flex: 2 }}>Usuario</span>
                    <span style={{ flex: 2 }}>Correo</span>
                    <span style={{ flex: 1 }}>Rol</span>
                    <span style={{ flex: 1 }}>Acciones</span>
                  </div>
                  {users.map(u => (
                    <div key={u.id} style={S.userRow}>
                      <div style={{ flex: 2, display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                        <div style={S.userAvatar} aria-hidden="true">{(u.name || "U").charAt(0).toUpperCase()}</div>
                        <span style={S.userName}>{u.name}</span>
                      </div>
                      <span style={{ flex: 2, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</span>
                      <span style={{ flex: 1 }}>
                        <span style={{
                          ...S.roleBadge,
                          background: u.role === "admin" ? "#ede9fe" : u.role === "restaurant" ? "#dbeafe" : "var(--surface2)",
                          color:      u.role === "admin" ? "#6b21a8" : u.role === "restaurant" ? "#1e40af" : "var(--text-muted)",
                        }}>
                          {u.role === "admin" ? "🔐 Admin" : u.role === "restaurant" ? "🏪 Restaurante" : "👤 Cliente"}
                        </span>
                      </span>
                      <div style={{ flex: 1 }}>
                        {u.role !== "admin" && (
                          <button style={S.deleteBtnSmall} onClick={() => setDeleteConfirm({ type: "user", id: u.id, name: u.name })}>
                            🗑️ Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Modal Crear/Editar Restaurante ── */}
      {restaurantModal && (
        <div style={S.modalBackdrop} onClick={() => !savingRestaurant && setRestaurantModal(null)}>
          <div style={S.modal} className="qb-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div style={S.modalHeader}>
              <h2 id="modal-title" style={S.modalTitle}>
                {restaurantModal === "new" ? "Nuevo restaurante" : `Editar ${restaurantModal.name}`}
              </h2>
              <button style={S.modalClose} onClick={() => setRestaurantModal(null)} aria-label="Cerrar">✕</button>
            </div>
            <div style={S.modalBody}>
              {restaurantErrors._form && (
                <div style={S.formError} role="alert"><span aria-hidden="true">⚠️</span> {restaurantErrors._form}</div>
              )}

              <div style={S.modalField}>
                <label style={S.modalLabel} htmlFor="r-name">Nombre del restaurante *</label>
                <input id="r-name" style={inputStyle(!!restaurantErrors.name)}
                  value={restaurantForm.name}
                  onChange={e => setRestaurantForm(f => ({ ...f, name: e.target.value }))}
                  maxLength={80}
                  placeholder="Ej: Pizza House" />
                <FieldError error={restaurantErrors.name} />
              </div>

              <div style={S.modalRow}>
                <div style={S.modalField}>
                  <label style={S.modalLabel} htmlFor="r-cat">Categoría *</label>
                  <select id="r-cat" style={{ ...inputStyle(!!restaurantErrors.category), appearance: "auto" }}
                    value={restaurantForm.category}
                    onChange={e => setRestaurantForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <FieldError error={restaurantErrors.category} />
                </div>
                <div style={S.modalField}>
                  <label style={S.modalLabel} htmlFor="r-rating">Rating (0-5) *</label>
                  <input id="r-rating" style={inputStyle(!!restaurantErrors.rating)}
                    type="text" inputMode="decimal"
                    value={restaurantForm.rating}
                    onChange={e => setRestaurantForm(f => ({ ...f, rating: e.target.value }))}
                    placeholder="4.5" />
                  <FieldError error={restaurantErrors.rating} />
                </div>
              </div>

              <div style={S.modalRow}>
                <div style={S.modalField}>
                  <label style={S.modalLabel} htmlFor="r-time">Tiempo de entrega *</label>
                  <input id="r-time" style={inputStyle(!!restaurantErrors.deliveryTime)}
                    value={restaurantForm.deliveryTime}
                    onChange={e => setRestaurantForm(f => ({ ...f, deliveryTime: e.target.value }))}
                    placeholder="20-30 min" />
                  <FieldError error={restaurantErrors.deliveryTime} />
                </div>
                <div style={S.modalField}>
                  <label style={S.modalLabel} htmlFor="r-min">Pedido mínimo (MXN) *</label>
                  <input id="r-min" style={inputStyle(!!restaurantErrors.minOrder)}
                    type="text" inputMode="numeric"
                    value={restaurantForm.minOrder}
                    onChange={e => setRestaurantForm(f => ({ ...f, minOrder: e.target.value }))}
                    placeholder="100" />
                  <FieldError error={restaurantErrors.minOrder} />
                </div>
              </div>

              <div style={S.modalField}>
                <label style={S.modalLabel} htmlFor="r-img">URL de imagen</label>
                <input id="r-img" style={inputStyle(!!restaurantErrors.image)}
                  value={restaurantForm.image}
                  onChange={e => setRestaurantForm(f => ({ ...f, image: e.target.value }))}
                  placeholder="https://..." />
                <FieldError error={restaurantErrors.image} />
                {restaurantForm.image && !restaurantErrors.image && (
                  <img src={restaurantForm.image} alt="" style={S.modalPreview}
                    onError={e => { e.target.style.display = "none" }} />
                )}
              </div>

              <div style={S.modalField}>
                <label style={S.modalLabel} htmlFor="r-badge">Badge (opcional)</label>
                <select id="r-badge" style={{ ...inputStyle(false), appearance: "auto" }}
                  value={restaurantForm.badge}
                  onChange={e => setRestaurantForm(f => ({ ...f, badge: e.target.value }))}>
                  <option value="">Sin badge</option>
                  <option value="Popular">Popular</option>
                  <option value="Más pedido">Más pedido</option>
                  <option value="Nuevo">Nuevo</option>
                </select>
              </div>

              <div style={S.modalField}>
                <label style={S.modalLabel} htmlFor="r-addr">Dirección</label>
                <input id="r-addr" style={inputStyle(false)}
                  value={restaurantForm.address}
                  onChange={e => setRestaurantForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Calle, colonia, ciudad" maxLength={150} />
              </div>
            </div>
            <div style={S.modalFooter}>
              <button style={S.modalCancel} onClick={() => setRestaurantModal(null)} disabled={savingRestaurant}>
                Cancelar
              </button>
              <button style={S.modalSave} onClick={saveRestaurant} disabled={savingRestaurant}>
                {savingRestaurant ? "Guardando..." : (restaurantModal === "new" ? "Crear restaurante" : "Guardar cambios")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmar eliminación ── */}
      {deleteConfirm && (
        <div style={S.modalBackdrop} onClick={() => setDeleteConfirm(null)}>
          <div style={{ ...S.modal, maxWidth: "420px" }} onClick={e => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <div style={{ padding: "32px 28px", textAlign: "center" }}>
              <div style={{ fontSize: "56px", marginBottom: "16px" }} aria-hidden="true">⚠️</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-xl)", fontWeight: 800, marginBottom: "10px" }}>
                ¿Eliminar {deleteConfirm.type === "restaurant" ? "restaurante" : "usuario"}?
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-base)", lineHeight: 1.5, marginBottom: "24px" }}>
                Esta acción no se puede deshacer. Se eliminará <strong>"{deleteConfirm.name}"</strong> permanentemente.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                <button style={S.modalCancel} onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                <button style={{ ...S.modalSave, background: "var(--danger)" }}
                  onClick={() => deleteConfirm.type === "restaurant"
                    ? deleteRestaurant(deleteConfirm.id)
                    : deleteUser(deleteConfirm.id)}>
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function KPICard({ icon, label, value, color }) {
  return (
    <div style={{ ...S.kpiCard, borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: "36px", marginBottom: "10px" }} aria-hidden="true">{icon}</div>
      <div style={{ ...S.kpiValue, color }}>{value}</div>
      <div style={S.kpiLabel}>{label}</div>
    </div>
  )
}

export default AdminDashboard

const S = {
  layout: { display: "flex", minHeight: "calc(100vh - 116px)" },
  loadingState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "20px" },
  spinner: { width: "52px", height: "52px", border: "5px solid var(--border)", borderTop: "5px solid var(--brand)", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  // Sidebar
  sidebar: { width: "240px", background: "var(--surface)", borderRight: "1px solid var(--border)", padding: "28px 20px", flexShrink: 0 },
  sidebarHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px", padding: "0 8px" },
  sidebarTitle: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-xl)", letterSpacing: "-0.5px" },
  sidebarNav: { display: "flex", flexDirection: "column", gap: "4px" },
  sidebarItem: { display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "var(--fs-base)", textAlign: "left", transition: "all 0.15s", minHeight: "var(--touch-min)" },
  sidebarIcon: { fontSize: "22px", width: "26px", textAlign: "center" },

  // Main
  main: { flex: 1, padding: "36px 44px", overflowX: "hidden" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "32px", flexWrap: "wrap" },
  title: { fontFamily: "var(--font-display)", fontSize: "var(--fs-2xl)", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "6px" },
  subtitle: { color: "var(--text-muted)", fontSize: "var(--fs-base)" },

  errorBanner: { background: "#fef2f2", border: "2px solid #fecaca", color: "var(--danger)", padding: "14px 18px", borderRadius: "var(--radius-sm)", fontSize: "var(--fs-base)", marginBottom: "20px", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px" },
  errorClose: { marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: "16px", padding: "4px 8px" },

  primaryBtn: { background: "var(--brand)", color: "white", border: "none", padding: "12px 24px", borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: "var(--fs-base)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", minHeight: "var(--touch-min)", fontFamily: "var(--font-body)" },
  refreshBtn: { background: "var(--surface)", color: "var(--text)", border: "2px solid var(--border)", padding: "10px 20px", borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: "var(--fs-base)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", minHeight: "var(--touch-min)", fontFamily: "var(--font-body)" },

  // KPIs
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px", marginBottom: "40px" },
  kpiCard: { background: "var(--surface)", borderRadius: "var(--radius)", padding: "26px 22px", border: "1px solid var(--border)", textAlign: "center", boxShadow: "var(--shadow-sm)" },
  kpiValue: { fontFamily: "var(--font-display)", fontSize: "var(--fs-2xl)", fontWeight: 800 },
  kpiLabel: { fontSize: "var(--fs-base)", color: "var(--text-muted)", marginTop: "6px", fontWeight: 500 },

  section: { marginBottom: "40px" },
  sectionTitle: { fontFamily: "var(--font-display)", fontSize: "var(--fs-xl)", fontWeight: 800, marginBottom: "20px" },

  // Restaurants
  restaurantGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" },
  restaurantCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column" },
  restaurantImgWrap: { position: "relative", height: "180px" },
  restaurantImg: { width: "100%", height: "100%", objectFit: "cover" },
  restaurantBadge: { position: "absolute", top: "12px", left: "12px", background: "white", color: "var(--brand)", padding: "5px 12px", borderRadius: "100px", fontSize: "var(--fs-sm)", fontWeight: 700 },
  restaurantBody: { padding: "18px 20px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 },
  restaurantName: { fontFamily: "var(--font-display)", fontSize: "var(--fs-lg)", fontWeight: 800 },
  restaurantMeta: { display: "flex", flexWrap: "wrap", gap: "8px" },
  metaChip: { background: "var(--surface2)", padding: "4px 12px", borderRadius: "100px", fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text-muted)" },
  restaurantAddr: { fontSize: "var(--fs-sm)", color: "var(--text-muted)", lineHeight: 1.4 },
  restaurantActions: { display: "flex", gap: "10px", marginTop: "auto", paddingTop: "8px" },
  editBtn: { flex: 1, padding: "10px", border: "2px solid var(--border)", background: "var(--surface)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "var(--fs-sm)", fontWeight: 600, fontFamily: "var(--font-body)", minHeight: "var(--touch-min)" },
  deleteBtn: { padding: "10px 16px", border: "2px solid #fecaca", background: "#fef2f2", color: "var(--danger)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "var(--fs-sm)", fontWeight: 600, fontFamily: "var(--font-body)", minHeight: "var(--touch-min)" },
  deleteBtnSmall: { padding: "8px 14px", border: "2px solid #fecaca", background: "#fef2f2", color: "var(--danger)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "var(--fs-sm)", fontWeight: 600, fontFamily: "var(--font-body)" },

  // Orders
  orderList: { display: "flex", flexDirection: "column", gap: "12px" },
  orderCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" },
  orderId: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-md)", marginBottom: "4px" },
  orderCustomer: { fontSize: "var(--fs-sm)", color: "var(--text)", marginBottom: "4px" },
  orderItems: { fontSize: "var(--fs-sm)", color: "var(--text-muted)" },
  orderRight: { textAlign: "right", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" },
  statusBadge: { padding: "5px 14px", borderRadius: "100px", fontSize: "var(--fs-sm)", fontWeight: 700 },
  orderTotal: { fontWeight: 800, fontSize: "var(--fs-md)", fontFamily: "var(--font-display)" },

  // Users
  userTable: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" },
  userTableHeader: { display: "flex", padding: "16px 20px", background: "var(--surface2)", fontWeight: 700, fontSize: "var(--fs-sm)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", gap: "16px" },
  userRow: { display: "flex", padding: "16px 20px", borderTop: "1px solid var(--border)", alignItems: "center", fontSize: "var(--fs-base)", gap: "16px" },
  userAvatar: { width: "40px", height: "40px", borderRadius: "50%", background: "var(--brand)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--fs-base)", fontFamily: "var(--font-display)", flexShrink: 0 },
  userName: { fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  roleBadge: { padding: "4px 12px", borderRadius: "100px", fontSize: "var(--fs-sm)", fontWeight: 700 },

  // Empty / loading
  emptyState: { textAlign: "center", padding: "80px 40px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)" },
  emptyTitle: { fontFamily: "var(--font-display)", fontSize: "var(--fs-xl)", fontWeight: 800, marginBottom: "10px" },
  emptyText: { color: "var(--text-muted)", fontSize: "var(--fs-base)" },

  // Modal
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(4px)" },
  modal: { background: "var(--surface)", borderRadius: "var(--radius)", width: "100%", maxWidth: "560px", maxHeight: "90vh", boxShadow: "var(--shadow-lg)", overflow: "hidden", display: "flex", flexDirection: "column" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 28px", borderBottom: "1px solid var(--border)" },
  modalTitle: { fontFamily: "var(--font-display)", fontSize: "var(--fs-xl)", fontWeight: 800 },
  modalClose: { background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-muted)", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" },
  modalBody: { padding: "24px 28px", display: "flex", flexDirection: "column", gap: "18px", overflowY: "auto", flex: 1 },
  modalRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  modalField: { display: "flex", flexDirection: "column", gap: "6px" },
  modalLabel: { fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--text)" },
  modalPreview: { width: "100%", height: "140px", objectFit: "cover", borderRadius: "var(--radius-sm)", marginTop: "10px", border: "1px solid var(--border)" },
  modalFooter: { display: "flex", gap: "12px", padding: "20px 28px", borderTop: "1px solid var(--border)" },
  modalCancel: { flex: 1, padding: "14px", border: "2px solid var(--border)", borderRadius: "var(--radius-sm)", background: "transparent", cursor: "pointer", fontWeight: 600, fontFamily: "var(--font-body)", fontSize: "var(--fs-base)", minHeight: "var(--touch-min)" },
  modalSave: { flex: 1, padding: "14px", background: "var(--brand)", color: "white", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)", fontSize: "var(--fs-base)", minHeight: "var(--touch-min)" },
  formError: { background: "#fef2f2", border: "2px solid #fecaca", color: "var(--danger)", padding: "12px 16px", borderRadius: "var(--radius-sm)", fontSize: "var(--fs-sm)", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" },
}
