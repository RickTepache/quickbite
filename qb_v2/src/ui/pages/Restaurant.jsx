import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import ProductModal from "../components/ProductModal"
import { useCart } from "../context/CartContext"
import { RestaurantRepository } from "../../infrastructure/repositories/RestaurantRepository"
import { FoodRepository } from "../../infrastructure/repositories/FoodRepository"
import { GetRestaurantByIdUseCase } from "../../application/usecases/GetRestaurantByIdUseCase"
import { GetMenuByRestaurantUseCase } from "../../application/usecases/GetMenuByRestaurantUseCase"

const restaurantRepo = new RestaurantRepository()
const foodRepo = new FoodRepository()
const getRestaurantByIdUseCase = new GetRestaurantByIdUseCase(restaurantRepo)
const getMenuByRestaurantUseCase = new GetMenuByRestaurantUseCase(foodRepo)

function Restaurant() {
  const { id } = useParams()
  const { addToCart, cart } = useCart()
  const [selectedItem, setSelectedItem] = useState(null)
  const [added, setAdded] = useState({})
  const [restaurant, setRestaurant] = useState(null)
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const rest = await getRestaurantByIdUseCase.execute(id)
        setRestaurant(rest)
        if (rest) {
          const items = await getMenuByRestaurantUseCase.execute(rest.id)
          setMenu(Array.isArray(items) ? items : [])
        }
      } catch (err) {
        console.error('Error cargando restaurante:', err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const restaurantCartItems = cart.filter(item => menu.some(m => m.id === item.id))
  const restaurantTotal = restaurantCartItems.reduce(
    (sum, item) => sum + (item.price + (item.extrasPrice || 0)) * item.quantity, 0
  )

  const handleAdd = (product) => {
    addToCart(product)
    setAdded(prev => ({ ...prev, [product.id]: true }))
    setTimeout(() => setAdded(prev => ({ ...prev, [product.id]: false })), 1200)
  }

  const getItemQty = (itemId) => {
    const found = cart.find(c => c.id === itemId)
    return found ? found.quantity : 0
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ textAlign: "center", padding: "140px 44px", color: "var(--text-muted)" }} role="status" aria-live="polite">
          <div style={{ fontSize: "56px", marginBottom: "20px" }} aria-hidden="true">⏳</div>
          <p style={{ fontSize: "var(--fs-md)" }}>Cargando restaurante...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div>
        <Navbar />
        <div style={{ textAlign: "center", padding: "140px 44px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "56px", marginBottom: "20px" }} aria-hidden="true">🍽️</div>
          <p style={{ fontSize: "var(--fs-md)", marginBottom: "16px" }}>Restaurante no encontrado.</p>
          <Link to="/" style={{ color: "var(--brand)", fontWeight: 700, fontSize: "var(--fs-base)" }}>← Volver al inicio</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />

      {/* Modal de personalización */}
      {selectedItem && (
        <ProductModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={handleAdd}
        />
      )}

      {/* Header */}
      <div style={styles.header}>
        <img src={restaurant.image} alt="" style={styles.headerImg} />
        <div style={styles.headerOverlay} />
        <div style={styles.headerContent}>
          <Link to="/" style={styles.back}>← Volver al inicio</Link>
          <h1 style={styles.restName}>{restaurant.name}</h1>
          <div style={styles.restMeta}>
            <span style={styles.metaItem}><span aria-hidden="true">⭐</span> {restaurant.rating}</span>
            <span style={styles.metaItem}><span aria-hidden="true">⏱</span> {restaurant.deliveryTime}</span>
            <span style={styles.metaItem}><span aria-hidden="true">🛒</span> Mínimo ${restaurant.minOrder} MXN</span>
            <span style={{ ...styles.metaItem, background: "rgba(255,69,0,0.78)" }}>{restaurant.category}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={styles.body} className="qb-restaurant-body">
        <div style={styles.menuCol}>
          <h2 style={styles.menuTitle}>Menú</h2>
          {menu.length === 0 ? (
            <div style={styles.empty}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }} aria-hidden="true">🍽️</div>
              <p style={{ fontSize: "var(--fs-base)" }}>Sin platillos disponibles.</p>
            </div>
          ) : (
            <div style={styles.menuGrid}>
              {menu.map((item, i) => {
                const qty = getItemQty(item.id)
                const isAdded = added[item.id]
                return (
                  <div key={item.id} className="animate-fadeUp menu-card"
                    style={{ animationDelay: `${i * 0.06}s`, ...styles.card }}>
                    <div style={styles.cardImgWrapper}>
                      <img src={item.image} alt="" style={styles.cardImg} className="card-image" />
                      {item.popular && <div style={styles.popularBadge}><span aria-hidden="true">🔥</span> Popular</div>}
                      {qty > 0 && <div style={styles.qtyOverlay}>{qty} en carrito</div>}
                    </div>
                    <div style={styles.cardBody}>
                      <h3 style={styles.itemName}>{item.name}</h3>
                      <p style={styles.itemPrice}>${item.price} <span style={styles.currency}>MXN</span></p>
                      <button
                        style={{
                          ...styles.addBtn,
                          background: isAdded ? "var(--success)" : "var(--brand)"
                        }}
                        onClick={() => setSelectedItem(item)}
                      >
                        {isAdded ? "✓ Agregado" : "+ Agregar al carrito"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Cart sidebar */}
        <aside style={styles.cartCol} className="qb-restaurant-sidebar" aria-label="Resumen del pedido">
          <div style={styles.cartBox}>
            <div style={styles.cartHeader}>
              <h3 style={styles.cartTitle}>Tu pedido</h3>
              {restaurantCartItems.length > 0 && (
                <span style={styles.cartCount}>
                  {restaurantCartItems.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              )}
            </div>
            {restaurantCartItems.length === 0 ? (
              <div style={styles.cartEmpty}>
                <div style={{ fontSize: "44px", marginBottom: "12px" }} aria-hidden="true">🛒</div>
                <p style={styles.cartEmptyText}>Agrega platillos para empezar tu pedido</p>
              </div>
            ) : (
              <>
                <div style={styles.cartItems}>
                  {restaurantCartItems.map((item, i) => (
                    <div key={`${item.id}-${i}`} style={styles.cartItem}>
                      <div style={styles.cartItemLeft}>
                        <span style={styles.cartQtyBadge}>{item.quantity}×</span>
                        <div>
                          <p style={styles.cartItemName}>{item.name}</p>
                          {item.customization?.comments && (
                            <p style={styles.cartItemNote}>📝 {item.customization.comments}</p>
                          )}
                          {item.customization?.removed?.length > 0 && (
                            <p style={styles.cartItemNote}>Sin: {item.customization.removed.join(", ")}</p>
                          )}
                        </div>
                      </div>
                      <span style={styles.cartItemPrice}>${item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div style={styles.cartDivider} />
                <div style={styles.cartTotalRow}>
                  <span style={styles.cartTotalLabel}>Subtotal</span>
                  <span style={styles.cartTotalValue}>${restaurantTotal} MXN</span>
                </div>
                {restaurantTotal < restaurant.minOrder && (
                  <div style={styles.minOrderWarning} role="status">
                    Faltan ${restaurant.minOrder - restaurantTotal} MXN para el mínimo
                  </div>
                )}
                <Link to="/cart" style={styles.checkoutBtn}>Ir al carrito →</Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Restaurant

const styles = {
  header: { position: "relative", height: "320px", overflow: "hidden" },
  headerImg: { width: "100%", height: "100%", objectFit: "cover" },
  headerOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.15) 60%)" },
  headerContent: { position: "absolute", bottom: "32px", left: "44px", right: "44px" },
  back: { color: "rgba(255,255,255,0.85)", fontSize: "var(--fs-base)", textDecoration: "none", display: "inline-block", marginBottom: "14px", fontWeight: 500 },
  restName: { fontFamily: "var(--font-display)", fontSize: "var(--fs-3xl)", fontWeight: 800, color: "white", marginBottom: "14px", letterSpacing: "-1px" },
  restMeta: { display: "flex", gap: "12px", flexWrap: "wrap" },
  metaItem: { background: "rgba(255,255,255,0.2)", color: "white", padding: "7px 16px", borderRadius: "100px", fontSize: "var(--fs-base)", fontWeight: 600, backdropFilter: "blur(6px)" },
  body: { maxWidth: "1280px", margin: "0 auto", padding: "44px 44px 96px", display: "grid", gridTemplateColumns: "1fr 360px", gap: "40px", alignItems: "start" },
  menuCol: {},
  menuTitle: { fontFamily: "var(--font-display)", fontSize: "var(--fs-2xl)", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "26px" },
  menuGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "22px" },
  card: { background: "var(--surface)", borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", transition: "transform 0.22s ease, box-shadow 0.22s ease", display: "flex", flexDirection: "column" },
  cardImgWrapper: { position: "relative", height: "180px", overflow: "hidden", flexShrink: 0 },
  cardImg: { width: "100%", height: "100%", objectFit: "cover" },
  popularBadge: { position: "absolute", top: "12px", left: "12px", background: "var(--brand)", color: "white", fontSize: "var(--fs-sm)", fontWeight: 700, padding: "5px 12px", borderRadius: "100px", zIndex: 1 },
  qtyOverlay: { position: "absolute", bottom: "12px", right: "12px", background: "var(--brand)", color: "white", fontSize: "var(--fs-sm)", fontWeight: 700, padding: "5px 12px", borderRadius: "100px" },
  cardBody: { padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 },
  itemName: { fontFamily: "var(--font-display)", fontSize: "var(--fs-md)", fontWeight: 700, color: "var(--text)", lineHeight: 1.3 },
  itemPrice: { fontSize: "var(--fs-2xl)", fontWeight: 800, color: "var(--brand)", fontFamily: "var(--font-display)", letterSpacing: "-0.5px" },
  currency: { fontSize: "var(--fs-sm)", fontWeight: 500, color: "var(--text-muted)" },
  addBtn: { width: "100%", padding: "12px", border: "none", borderRadius: "var(--radius-sm)", color: "white", fontWeight: 700, fontSize: "var(--fs-base)", cursor: "pointer", transition: "background 0.2s", marginTop: "auto", fontFamily: "var(--font-body)", minHeight: "var(--touch-min)" },
  cartCol: { position: "sticky", top: "100px" },
  cartBox: { background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow)", overflow: "hidden" },
  cartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 22px", borderBottom: "1px solid var(--border)" },
  cartTitle: { fontFamily: "var(--font-display)", fontSize: "var(--fs-lg)", fontWeight: 800 },
  cartCount: { background: "var(--brand-light)", color: "var(--brand)", fontSize: "var(--fs-sm)", fontWeight: 700, padding: "5px 12px", borderRadius: "100px" },
  cartEmpty: { padding: "44px 22px", textAlign: "center" },
  cartEmptyText: { color: "var(--text-muted)", fontSize: "var(--fs-base)", lineHeight: 1.5 },
  cartItems: { padding: "16px 22px", display: "flex", flexDirection: "column", gap: "14px" },
  cartItem: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" },
  cartItemLeft: { display: "flex", alignItems: "flex-start", gap: "10px", flex: 1, minWidth: 0 },
  cartQtyBadge: { background: "var(--surface2)", color: "var(--text-muted)", fontSize: "var(--fs-sm)", fontWeight: 700, padding: "3px 9px", borderRadius: "8px", flexShrink: 0, marginTop: "2px" },
  cartItemName: { fontSize: "var(--fs-base)", fontWeight: 500, color: "var(--text)" },
  cartItemNote: { fontSize: "var(--fs-sm)", color: "var(--text-muted)", marginTop: "3px" },
  cartItemPrice: { fontSize: "var(--fs-base)", fontWeight: 700, color: "var(--text)", flexShrink: 0 },
  cartDivider: { height: "1px", background: "var(--border)", margin: "0 22px" },
  cartTotalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px" },
  cartTotalLabel: { fontSize: "var(--fs-base)", color: "var(--text-muted)", fontWeight: 500 },
  cartTotalValue: { fontFamily: "var(--font-display)", fontSize: "var(--fs-xl)", fontWeight: 800, color: "var(--text)" },
  minOrderWarning: { margin: "0 22px 14px", background: "#fef9c3", color: "#854d0e", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontSize: "var(--fs-sm)", fontWeight: 600, textAlign: "center" },
  checkoutBtn: { margin: "0 22px 22px", padding: "16px", background: "var(--brand)", color: "white", borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: "var(--fs-md)", textDecoration: "none", minHeight: "52px", display: "flex", alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", padding: "72px 44px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }
}
