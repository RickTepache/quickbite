import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { ordersAPI, extractList } from "../../infrastructure/api/api"

const STATUS_CONFIG = {
  pending:   { label: "Pendiente",   color: "#854d0e", bg: "#fef9c3", icon: "⏳" },
  preparing: { label: "Preparando",  color: "#1e40af", bg: "#dbeafe", icon: "👨‍🍳" },
  ready:     { label: "Listo 🔔",    color: "#6b21a8", bg: "#ede9fe", icon: "✅" },
  delivered: { label: "Entregado",   color: "#166534", bg: "#dcfce7", icon: "🎉" },
  cancelled: { label: "Cancelado",   color: "#991b1b", bg: "#fee2e2", icon: "❌" },
}

const safeParse = (val, fallback = []) => {
  if (Array.isArray(val)) return val
  if (val == null || val === "") return fallback
  try { return JSON.parse(val) } catch { return fallback }
}

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedOrder, setExpandedOrder] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const raw = await ordersAPI.getMyOrders()
        // El back puede responder { data: [] }, { orders: [] }, [], etc.
        const list = extractList(raw)
        setOrders(list)
      } catch (err) {
        console.error('Error cargando pedidos:', err.message)
        setError(err.message || "No se pudieron cargar tus pedidos")
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cancelOrder = async (orderId) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o))
    try {
      await ordersAPI.cancel(orderId)
    } catch (err) {
      // Revertir si falla
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "pending" } : o))
      setError("No se pudo cancelar el pedido: " + (err.message || "error desconocido"))
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    } catch { return dateStr }
  }

  return (
    <div style={S.page}>
      <Navbar />

      <div style={S.container}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Mis pedidos</h1>
            <p style={S.subtitle}>Historial de todos tus pedidos realizados</p>
          </div>
          <Link to="/" style={S.backBtn}>← Seguir comprando</Link>
        </div>

        {loading ? (
          <div style={S.emptyState} role="status" aria-live="polite">
            <div style={{ fontSize: "56px", marginBottom: "20px" }} aria-hidden="true">⏳</div>
            <p style={S.emptyText}>Cargando tus pedidos...</p>
          </div>
        ) : error ? (
          <div style={S.errorState} role="alert">
            <div style={{ fontSize: "56px", marginBottom: "20px" }} aria-hidden="true">⚠️</div>
            <p style={S.emptyTitle}>No se pudieron cargar tus pedidos</p>
            <p style={S.emptyText}>{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={S.emptyState}>
            <div style={{ fontSize: "72px", marginBottom: "20px" }} aria-hidden="true">📭</div>
            <p style={S.emptyTitle}>Aún no tienes pedidos</p>
            <p style={S.emptyText}>¡Explora nuestros restaurantes y haz tu primer pedido!</p>
            <Link to="/" style={S.exploreBtn}>Ver restaurantes →</Link>
          </div>
        ) : (
          <div>
          {error && (
            <div style={{ background:"#fef2f2", border:"2px solid #fecaca", color:"var(--danger)", padding:"14px 18px", borderRadius:"var(--radius-sm)", fontSize:"var(--fs-base)", marginBottom:"20px", fontWeight:600 }} role="alert">
              ⚠️ {error} <button onClick={() => setError("")} style={{ marginLeft:"12px", background:"none", border:"none", cursor:"pointer", color:"var(--danger)", fontWeight:700 }}>✕</button>
            </div>
          )}
          <div style={S.orderList}>
            {orders.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const isExpanded = expandedOrder === order.id

              return (
                <div key={order.id} style={S.orderCard}>
                  {/* Header del pedido */}
                  <div style={S.orderHeader}>
                    <div style={S.orderHeaderLeft}>
                      <span style={S.orderId}>Pedido #{order.id}</span>
                      <span style={{ ...S.statusBadge, background: cfg.bg, color: cfg.color }}>
                        <span aria-hidden="true">{cfg.icon}</span> {cfg.label}
                      </span>
                      <span style={S.deliveryBadge}>
                        {order.delivery_type === 'pickup' ? '🏪 Pickup' : '🛵 Delivery'}
                      </span>
                    </div>
                    <div style={S.orderHeaderRight}>
                      <span style={S.orderDate}>{formatDate(order.created_at)}</span>
                      <span style={S.orderTotal}>${order.total} MXN</span>
                    </div>
                  </div>

                  {/* Restaurante */}
                  <div style={S.restaurantRow}>
                    {order.restaurant_image && (
                      <img src={order.restaurant_image} alt="" style={S.restaurantImg} />
                    )}
                    <div>
                      <p style={S.restaurantName}>{order.restaurant_name || "Restaurante"}</p>
                      <p style={S.restaurantSub}>
                        {order.pay_method === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                      </p>
                    </div>
                  </div>

                  {/* Items resumidos */}
                  <div style={S.itemsRow}>
                    {(order.items || []).slice(0, 3).map((item, i) => (
                      <span key={i} style={S.itemChip}>
                        {item.quantity}× {item.name}
                      </span>
                    ))}
                    {(order.items || []).length > 3 && (
                      <span style={S.itemChipMore}>+{order.items.length - 3} más</span>
                    )}
                  </div>

                  {/* Detalle expandido */}
                  {isExpanded && (
                    <div style={S.expandedSection}>
                      <div style={S.expandedDivider} />

                      <p style={S.expandedTitle}><span aria-hidden="true">🛒</span> Detalle del pedido</p>
                      <div style={S.itemsList}>
                        {(order.items || []).map((item, i) => {
                          const extras = safeParse(item.extras)
                          const removed = safeParse(item.removed)
                          return (
                            <div key={i} style={S.itemRow}>
                              <div style={S.itemLeft}>
                                <span style={S.itemQty}>{item.quantity}×</span>
                                <div>
                                  <p style={S.itemName}>{item.name}</p>
                                  {extras.length > 0 && (
                                    <p style={S.itemNote}>
                                      <span aria-hidden="true">➕</span> {extras.join(', ')}
                                    </p>
                                  )}
                                  {removed.length > 0 && (
                                    <p style={{ ...S.itemNote, color: 'var(--danger)' }}>
                                      <span aria-hidden="true">🚫</span> Sin: {removed.join(', ')}
                                    </p>
                                  )}
                                  {item.comments && (
                                    <p style={S.itemNote}><span aria-hidden="true">💬</span> {item.comments}</p>
                                  )}
                                </div>
                              </div>
                              <span style={S.itemPrice}>${(item.unit_price || item.price || 0) * item.quantity} MXN</span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Dirección si es delivery */}
                      {order.delivery_type === 'delivery' && order.address_street && (
                        <div style={S.addressBox}>
                          <p style={S.expandedTitle}><span aria-hidden="true">📍</span> Dirección de entrega</p>
                          <p style={S.addressText}>
                            {order.address_street}, {order.address_colony}
                            {order.address_city ? `, ${order.address_city}` : ''}
                          </p>
                          {order.address_refs && (
                            <p style={{ ...S.addressText, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Ref: {order.address_refs}
                            </p>
                          )}
                        </div>
                      )}

                      <div style={S.totalRow}>
                        <span style={S.totalLabel}>Total pagado</span>
                        <span style={S.totalValue}>${order.total} MXN</span>
                      </div>
                    </div>
                  )}

                  {/* Footer del card */}
                  <div style={S.orderFooter}>
                    <button
                      style={S.detailBtn}
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? '▲ Ocultar detalle' : '▼ Ver detalle'}
                    </button>
                    {order.status === 'delivered' && (
                      <Link to="/" style={S.reorderBtn}>🔁 Pedir de nuevo</Link>
                    )}
                    {order.status === 'pending' && (
                      <button
                        style={S.cancelBtn}
                        onClick={() => cancelOrder(order.id)}
                      >
                        ❌ Cancelar pedido
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

const S = {
  page: { minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" },
  container: { maxWidth: "880px", margin: "0 auto", padding: "44px 28px 88px", flex: 1, width: "100%" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "36px", flexWrap: "wrap", gap: "16px" },
  title: { fontFamily: "var(--font-display)", fontSize: "var(--fs-2xl)", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "6px" },
  subtitle: { color: "var(--text-muted)", fontSize: "var(--fs-base)" },
  backBtn: { padding: "10px 20px", border: "2px solid var(--border)", borderRadius: "100px", fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--text)", textDecoration: "none", minHeight: "var(--touch-min)", display: "flex", alignItems: "center" },
  emptyState: { textAlign: "center", padding: "96px 28px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" },
  errorState: { textAlign: "center", padding: "72px 28px", background: "#fef2f2", borderRadius: "var(--radius)", border: "2px solid #fecaca" },
  emptyTitle: { fontFamily: "var(--font-display)", fontSize: "var(--fs-xl)", fontWeight: 800, marginBottom: "10px" },
  emptyText: { color: "var(--text-muted)", fontSize: "var(--fs-base)", marginBottom: "28px" },
  exploreBtn: { display: "inline-block", padding: "14px 32px", background: "var(--brand)", color: "white", borderRadius: "100px", fontWeight: 700, fontSize: "var(--fs-base)", textDecoration: "none", minHeight: "var(--touch-min)" },
  orderList: { display: "flex", flexDirection: "column", gap: "20px" },
  orderCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-sm)" },
  orderHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 24px", flexWrap: "wrap", gap: "10px" },
  orderHeaderLeft: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  orderHeaderRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" },
  orderId: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-md)" },
  statusBadge: { padding: "5px 14px", borderRadius: "100px", fontSize: "var(--fs-sm)", fontWeight: 700 },
  deliveryBadge: { padding: "5px 12px", borderRadius: "100px", fontSize: "var(--fs-sm)", fontWeight: 600, background: "var(--surface2)", color: "var(--text-muted)", border: "1px solid var(--border)" },
  orderDate: { fontSize: "var(--fs-sm)", color: "var(--text-muted)" },
  orderTotal: { fontFamily: "var(--font-display)", fontSize: "var(--fs-lg)", fontWeight: 800, color: "var(--brand)" },
  restaurantRow: { display: "flex", alignItems: "center", gap: "14px", padding: "0 24px 16px" },
  restaurantImg: { width: "52px", height: "52px", borderRadius: "12px", objectFit: "cover", flexShrink: 0 },
  restaurantName: { fontWeight: 700, fontSize: "var(--fs-base)" },
  restaurantSub: { fontSize: "var(--fs-sm)", color: "var(--text-muted)", marginTop: "3px" },
  itemsRow: { display: "flex", flexWrap: "wrap", gap: "8px", padding: "0 24px 18px" },
  itemChip: { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "100px", padding: "5px 12px", fontSize: "var(--fs-sm)", color: "var(--text)" },
  itemChipMore: { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "100px", padding: "5px 12px", fontSize: "var(--fs-sm)", color: "var(--text-muted)", fontStyle: "italic" },
  expandedSection: { padding: "0 24px 18px" },
  expandedDivider: { height: "1px", background: "var(--border)", marginBottom: "20px" },
  expandedTitle: { fontSize: "var(--fs-sm)", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px" },
  itemsList: { display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" },
  itemRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" },
  itemLeft: { display: "flex", gap: "12px", flex: 1 },
  itemQty: { background: "var(--brand)", color: "white", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-sm)", fontWeight: 800, flexShrink: 0, marginTop: "2px" },
  itemName: { fontSize: "var(--fs-base)", fontWeight: 600 },
  itemNote: { fontSize: "var(--fs-sm)", color: "var(--text-muted)", marginTop: "3px" },
  itemPrice: { fontSize: "var(--fs-base)", fontWeight: 700, flexShrink: 0 },
  addressBox: { background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "14px 16px", marginBottom: "14px" },
  addressText: { fontSize: "var(--fs-base)", fontWeight: 500, marginTop: "8px" },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "1px solid var(--border)" },
  totalLabel: { fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--text-muted)" },
  totalValue: { fontFamily: "var(--font-display)", fontSize: "var(--fs-xl)", fontWeight: 800, color: "var(--brand)" },
  orderFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderTop: "1px solid var(--border)", background: "var(--surface2)" },
  detailBtn: { background: "none", border: "none", fontSize: "var(--fs-base)", color: "var(--text-muted)", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", padding: "8px 0", minHeight: "var(--touch-min)" },
  reorderBtn: { fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--brand)", textDecoration: "none" },
  cancelBtn: { background: "none", border: "2px solid #fecaca", borderRadius: "var(--radius-sm)", color: "var(--danger)", fontSize: "var(--fs-sm)", fontWeight: 700, cursor: "pointer", padding: "8px 16px", fontFamily: "var(--font-body)", minHeight: "var(--touch-min)" },
}
