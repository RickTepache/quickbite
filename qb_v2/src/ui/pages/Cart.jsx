import { Link, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"

function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart, total } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (cart.length === 0) {
    return (
      <div>
        <Navbar />
        <div style={styles.emptyPage}>
          <div style={styles.emptyCard}>
            <div style={styles.emptyIconWrapper}>
              <span style={styles.emptyIcon} aria-hidden="true">🛒</span>
            </div>
            <h2 style={styles.emptyTitle}>Tu carrito está vacío</h2>
            <p style={styles.emptySub}>
              Aún no has agregado nada. Explora los restaurantes y encuentra algo que se te antoje.
            </p>
            <Link to="/" style={styles.shopBtn}>
              Explorar restaurantes →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0)
  const deliveryFee = 0
  const finalTotal = total + deliveryFee

  return (
    <div>
      <Navbar />
      <div style={styles.main} className="qb-cart-main">

        {/* LEFT */}
        <div style={styles.left}>
          <div style={styles.pageHeader}>
            <div>
              <h1 style={styles.title}>Mi Carrito</h1>
              <p style={styles.subtitle}>{itemCount} {itemCount === 1 ? "producto" : "productos"}</p>
            </div>
            <button style={styles.clearBtn} onClick={clearCart}>
              Limpiar todo
            </button>
          </div>

          <div style={styles.items}>
            {cart.map((item, i) => (
              <div
                key={item.cartKey}
                className="animate-fadeUp qb-cart-item"
                style={{ ...styles.item, animationDelay: `${i * 0.05}s` }}
              >
                <img src={item.image} alt="" style={styles.itemImg} className="qb-cart-item-img" />

                <div style={styles.itemInfo}>
                  <h3 style={styles.itemName}>{item.name}</h3>
                  <p style={styles.itemUnitPrice}>
                    ${item.price + (item.extrasPrice || 0)} MXN c/u
                    {item.extrasPrice > 0 && (
                      <span style={styles.extrasBadge}>+${item.extrasPrice} extras</span>
                    )}
                  </p>

                  {item.customization && (
                    <div style={styles.customSummary}>
                      {item.customization.extras && item.customization.extras.length > 0 && (
                        <p style={styles.customLine}>
                          <span style={styles.customIcon} aria-hidden="true">➕</span>
                          {item.customization.extras.map(e => e.replace(/\s*\+\$\d+/, "")).join(", ")}
                        </p>
                      )}
                      {item.customization.removed && item.customization.removed.length > 0 && (
                        <p style={styles.customLine}>
                          <span style={styles.customIcon} aria-hidden="true">🚫</span>
                          Sin: {item.customization.removed.join(", ")}
                        </p>
                      )}
                      {item.customization.spicy && item.customization.spicy !== "normal" && (
                        <p style={styles.customLine}>
                          <span style={styles.customIcon} aria-hidden="true">🌶</span>
                          {item.customization.spicy === "sin" ? "Sin picante" : "Extra picante"}
                        </p>
                      )}
                      {item.customization.comments && (
                        <p style={styles.customLine}>
                          <span style={styles.customIcon} aria-hidden="true">💬</span>
                          {item.customization.comments}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Quantity controls */}
                <div style={styles.controls}>
                  <button
                    style={styles.qtyBtn}
                    onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                    aria-label="Reducir cantidad"
                  >
                    −
                  </button>
                  <span style={styles.qty} aria-label={`Cantidad: ${item.quantity}`}>{item.quantity}</span>
                  <button
                    style={{ ...styles.qtyBtn, ...styles.qtyBtnAdd }}
                    onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>

                {/* Line total + remove */}
                <div style={styles.itemRight}>
                  <p style={styles.lineTotal}>${(item.price + (item.extrasPrice || 0)) * item.quantity} <span style={styles.mxn}>MXN</span></p>
                  <button
                    style={styles.removeBtn}
                    onClick={() => removeFromCart(item.cartKey)}
                    aria-label={`Eliminar ${item.name} del carrito`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Link to="/" style={styles.continueLink}>
            ← Seguir comprando
          </Link>
        </div>

        {/* RIGHT — Order summary */}
        <div style={styles.right} className="qb-cart-right">
          <div style={styles.summary}>
            <h2 style={styles.summaryTitle}>Resumen del pedido</h2>

            <div style={styles.summaryItems}>
              {cart.map(item => (
                <div key={item.cartKey} style={styles.summaryItem}>
                  <span style={styles.summaryItemName}>
                    <span style={styles.summaryQty}>{item.quantity}×</span>
                    {item.name}
                  </span>
                  <span style={styles.summaryItemPrice}>${(item.price + (item.extrasPrice || 0)) * item.quantity}</span>
                </div>
              ))}
            </div>

            <div style={styles.divider} />

            <div style={styles.summaryRow}>
              <span style={styles.rowLabel}>Subtotal</span>
              <span style={styles.rowValue}>${total} MXN</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.rowLabel}>Envío</span>
              <span style={{ ...styles.rowValue, color: "var(--success)", fontWeight: 700 }}>Gratis 🎉</span>
            </div>

            <div style={styles.totalBox}>
              <span style={styles.totalLabel}>Total a pagar</span>
              <span style={styles.totalValue}>${finalTotal} MXN</span>
            </div>

            {user ? (
              <Link to="/checkout" style={styles.checkoutBtn}>
                Realizar pedido →
              </Link>
            ) : (
              <div>
                <button style={styles.checkoutBtn} onClick={() => navigate("/login")}>
                  Iniciar sesión para continuar →
                </button>
                <p style={{ textAlign: "center", fontSize: "var(--fs-sm)", color: "var(--text-muted)", marginTop: "10px" }}>Necesitas una cuenta para realizar pedidos</p>
              </div>
            )}

            <div style={styles.badges}>
              <span style={styles.badge}>🔒 Pago seguro</span>
              <span style={styles.badge}>⚡ Entrega rápida</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Cart

const styles = {
  // Empty state
  emptyPage: {
    minHeight: "70vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "44px"
  },
  emptyCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "72px 56px",
    textAlign: "center",
    maxWidth: "480px",
    width: "100%",
    boxShadow: "var(--shadow)"
  },
  emptyIconWrapper: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    background: "var(--surface2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 28px",
    fontSize: "44px"
  },
  emptyIcon: {},
  emptyTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-2xl)",
    fontWeight: 800,
    marginBottom: "12px",
    letterSpacing: "-0.5px"
  },
  emptySub: {
    color: "var(--text-muted)",
    fontSize: "var(--fs-base)",
    lineHeight: 1.6,
    marginBottom: "32px"
  },
  shopBtn: {
    display: "inline-block",
    background: "var(--brand)",
    color: "white",
    padding: "14px 32px",
    borderRadius: "100px",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "var(--fs-base)",
    minHeight: "var(--touch-min)"
  },

  // Main layout
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "44px 44px 88px",
    display: "grid",
    gridTemplateColumns: "1fr 400px",
    gap: "36px",
    alignItems: "start"
  },
  left: {},
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px"
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-2xl)",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    marginBottom: "6px"
  },
  subtitle: {
    color: "var(--text-muted)",
    fontSize: "var(--fs-base)"
  },
  clearBtn: {
    background: "transparent",
    border: "2px solid var(--border)",
    color: "var(--text-muted)",
    fontSize: "var(--fs-sm)",
    fontWeight: 600,
    cursor: "pointer",
    padding: "10px 18px",
    borderRadius: "100px",
    fontFamily: "var(--font-body)",
    transition: "all 0.2s",
    minHeight: "var(--touch-min)"
  },

  // Items
  items: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginBottom: "28px"
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    background: "var(--surface)",
    borderRadius: "var(--radius)",
    padding: "20px",
    border: "1px solid var(--border)",
    transition: "box-shadow 0.2s"
  },
  itemImg: {
    width: "92px",
    height: "92px",
    objectFit: "cover",
    borderRadius: "var(--radius-sm)",
    flexShrink: 0
  },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-md)",
    fontWeight: 700,
    marginBottom: "6px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  itemUnitPrice: {
    color: "var(--text-muted)",
    fontSize: "var(--fs-sm)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap"
  },
  extrasBadge: {
    background: "var(--brand-light)",
    color: "var(--brand)",
    fontSize: "var(--fs-xs)",
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: "100px"
  },
  customSummary: {
    marginTop: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  customLine: {
    fontSize: "var(--fs-sm)",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "flex-start",
    gap: "6px",
    lineHeight: 1.4
  },
  customIcon: {
    fontSize: "var(--fs-sm)",
    flexShrink: 0,
    marginTop: "1px"
  },

  // Qty controls
  controls: {
    display: "flex",
    alignItems: "center",
    gap: "0",
    background: "var(--surface2)",
    borderRadius: "100px",
    padding: "3px",
    border: "1px solid var(--border)"
  },
  qtyBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-muted)",
    fontWeight: 700,
    lineHeight: 1,
    transition: "background 0.15s, color 0.15s"
  },
  qtyBtnAdd: {
    background: "var(--brand)",
    color: "white"
  },
  qty: {
    fontWeight: 800,
    fontSize: "var(--fs-md)",
    minWidth: "36px",
    textAlign: "center",
    fontFamily: "var(--font-display)"
  },

  // Line total
  itemRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "10px",
    flexShrink: 0
  },
  lineTotal: {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "var(--fs-lg)",
    color: "var(--text)"
  },
  mxn: {
    fontSize: "var(--fs-sm)",
    fontWeight: 500,
    color: "var(--text-muted)"
  },
  removeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--text-muted)",
    padding: "8px",
    display: "flex",
    alignItems: "center",
    borderRadius: "8px",
    transition: "color 0.2s, background 0.2s",
    minWidth: "var(--touch-min)",
    minHeight: "var(--touch-min)",
    justifyContent: "center"
  },

  continueLink: {
    color: "var(--text-muted)",
    fontSize: "var(--fs-base)",
    fontWeight: 500,
    textDecoration: "none",
    display: "inline-block"
  },

  // Summary
  right: {
    position: "sticky",
    top: "100px"
  },
  summary: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "28px",
    boxShadow: "var(--shadow)"
  },
  summaryTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-lg)",
    fontWeight: 800,
    marginBottom: "20px",
    letterSpacing: "-0.3px"
  },
  summaryItems: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "18px"
  },
  summaryItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px"
  },
  summaryItemName: {
    fontSize: "var(--fs-sm)",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  summaryQty: {
    fontWeight: 700,
    color: "var(--brand)",
    fontSize: "var(--fs-sm)",
    flexShrink: 0
  },
  summaryItemPrice: {
    fontSize: "var(--fs-sm)",
    fontWeight: 600,
    color: "var(--text)",
    flexShrink: 0
  },
  divider: {
    height: "1px",
    background: "var(--border)",
    margin: "18px 0"
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  rowLabel: {
    fontSize: "var(--fs-base)",
    color: "var(--text-muted)"
  },
  rowValue: {
    fontSize: "var(--fs-base)",
    fontWeight: 600,
    color: "var(--text)"
  },
  totalBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--surface2)",
    borderRadius: "var(--radius-sm)",
    padding: "16px 18px",
    margin: "18px 0"
  },
  totalLabel: {
    fontSize: "var(--fs-base)",
    fontWeight: 600,
    color: "var(--text-muted)"
  },
  totalValue: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-2xl)",
    fontWeight: 800,
    color: "var(--text)",
    letterSpacing: "-0.5px"
  },
  checkoutBtn: {
    display: "block",
    width: "100%",
    padding: "16px",
    background: "var(--brand)",
    color: "white",
    border: "none",
    borderRadius: "var(--radius-sm)",
    fontWeight: 700,
    fontSize: "var(--fs-md)",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    marginBottom: "16px",
    letterSpacing: "-0.2px",
    textAlign: "center",
    minHeight: "52px"
  },
  badges: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    flexWrap: "wrap"
  },
  badge: {
    fontSize: "var(--fs-sm)",
    color: "var(--text-muted)",
    fontWeight: 500
  }
}
