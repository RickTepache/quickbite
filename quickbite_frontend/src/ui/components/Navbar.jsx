import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { useAuth } from "../context/AuthContext"
import { RestaurantRepository } from "../../infrastructure/repositories/RestaurantRepository"
import { FoodRepository } from "../../infrastructure/repositories/FoodRepository"

const restaurantRepo = new RestaurantRepository()
const foodRepo = new FoodRepository()

const PROMOS = [
  { icon: "🔥", text: "Solo hoy — 20% OFF en todas las pizzas", urgency: true },
  { icon: "⚡", text: "¡3 personas pidieron Burger Town en los últimos 10 min!", urgency: false },
  { icon: "🎁", text: "Envío GRATIS en tu primer pedido — úsalo hoy", urgency: true },
  { icon: "👀", text: "La Pizza Pepperoni es lo más pedido esta semana", urgency: false },
]

function Navbar() {
  const { itemCount, total } = useCart()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [promoIndex, setPromoIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const searchRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setPromoIndex(i => (i + 1) % PROMOS.length); setVisible(true) }, 300)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return }
    const q = query.toLowerCase()
    const load = async () => {
      const restaurants = (await restaurantRepo.getAll()).filter(r =>
        r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
      ).map(r => ({ type: "restaurant", id: r.id, name: r.name, sub: r.category, image: r.image }))

      const foods = (await foodRepo.getAll()).filter(f =>
        f.name.toLowerCase().includes(q)
      ).map(f => ({ type: "food", id: f.restaurantId, name: f.name, sub: `$${f.price} MXN`, image: f.image }))

      setResults([...restaurants, ...foods].slice(0, 6))
    }
    load()
  }, [query])

  // Cerrar search al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Cerrar menú de perfil al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // También cerrar con Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setShowProfileMenu(false)
        setShowResults(false)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const handleLogout = () => { logout(); navigate("/"); setShowProfileMenu(false) }

  const handleResultClick = (result) => {
    navigate(`/restaurant/${result.id}`)
    setQuery(""); setResults([]); setShowResults(false)
  }

  const promo = PROMOS[promoIndex]

  return (
    <div style={styles.wrapper}>
      <div style={styles.promoBanner} className="qb-nav-promo" role="status" aria-live="polite">
        <span style={{ ...styles.promoText, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-6px)", transition: "opacity 0.3s ease, transform 0.3s ease" }}>
          <span aria-hidden="true">{promo.icon}</span>&nbsp;
          {promo.urgency
            ? <><strong>{promo.text.split("—")[0].trim()}</strong>{promo.text.includes("—") ? ` — ${promo.text.split("—")[1].trim()}` : ""}</>
            : promo.text}
        </span>
      </div>

      <nav style={styles.nav} className="qb-nav" aria-label="Navegación principal">
        <Link to="/" style={styles.logo} aria-label="QuickBite — ir al inicio">
          <span style={styles.logoIcon} aria-hidden="true">🍔</span>
          <span style={styles.logoText} className="qb-nav-logo-text">QuickBite</span>
        </Link>

        {/* Search */}
        <div style={styles.searchWrapper} ref={searchRef} className="qb-nav-search">
          <span style={styles.searchIcon} aria-hidden="true">🔍</span>
          <input
            style={styles.search}
            placeholder="Busca tacos, pizza, sushi..."
            value={query}
            onChange={e => { setQuery(e.target.value); setShowResults(true) }}
            onFocus={() => setShowResults(true)}
            aria-label="Buscar restaurantes o platillos"
            maxLength={80}
          />
          {query && (
            <button style={styles.clearBtn} onClick={() => { setQuery(""); setResults([]) }} aria-label="Limpiar búsqueda">
              ✕
            </button>
          )}

          {showResults && results.length > 0 && (
            <div style={styles.dropdown} role="listbox">
              {results.map((r, i) => (
                <button key={i} style={styles.dropdownItem} onClick={() => handleResultClick(r)} role="option">
                  <img src={r.image} alt="" style={styles.dropdownImg} />
                  <div style={styles.dropdownInfo}>
                    <span style={styles.dropdownName}>{r.name}</span>
                    <span style={styles.dropdownSub}>
                      {r.type === "restaurant" ? "🏪 Restaurante" : "🍽️ Platillo"} · {r.sub}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showResults && query.length >= 2 && results.length === 0 && (
            <div style={styles.dropdown}>
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
                Sin resultados para "{query}"
              </div>
            </div>
          )}
        </div>

        <div style={styles.actions}>
          <Link to="/cart" style={{
            ...styles.cartBtn,
            background: itemCount > 0 ? "var(--brand)" : "var(--surface2)",
            color: itemCount > 0 ? "white" : "var(--text-muted)",
            border: itemCount > 0 ? "none" : "2px solid var(--border)",
            boxShadow: itemCount > 0 ? "0 4px 16px rgba(255,69,0,0.35)" : "none"
          }} aria-label={`Mi carrito${itemCount > 0 ? `, ${itemCount} ${itemCount === 1 ? "item" : "items"}, total ${total} pesos` : ", vacío"}`}>
            <span style={{ fontSize: "20px" }} aria-hidden="true">🛒</span>
            {itemCount > 0 ? (
              <><span style={styles.cartLabel} className="qb-nav-cart-label">{itemCount} {itemCount === 1 ? "item" : "items"}</span><span style={styles.cartSep} className="qb-nav-cart-label">·</span><span style={styles.cartTotal}>${total}</span></>
            ) : (
              <span style={styles.cartLabel} className="qb-nav-cart-label">Mi carrito</span>
            )}
          </Link>

          {user ? (
            <div style={styles.profileWrapper} ref={profileRef}>
              {/* Avatar — abre el menú */}
              <button
                style={styles.avatarBtn}
                onClick={() => setShowProfileMenu(prev => !prev)}
                aria-haspopup="menu"
                aria-expanded={showProfileMenu}
                aria-label={`Menú de usuario: ${user.name}`}
              >
                <div style={styles.userAvatar} aria-hidden="true">{user.name.charAt(0).toUpperCase()}</div>
                <span style={styles.userName} className="qb-nav-username">{user.name.split(" ")[0]}</span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "2px" }} aria-hidden="true">
                  {showProfileMenu ? "▲" : "▼"}
                </span>
              </button>

              {/* Menú desplegable */}
              {showProfileMenu && (
                <div style={styles.profileMenu} role="menu">
                  {/* Header del menú */}
                  <div style={styles.profileMenuHeader}>
                    <div style={styles.profileMenuAvatar} aria-hidden="true">{user.name.charAt(0).toUpperCase()}</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={styles.profileMenuName}>{user.name}</p>
                      <p style={styles.profileMenuEmail}>{user.email}</p>
                    </div>
                  </div>

                  <div style={styles.profileMenuDivider} />

                  {/* Opciones según rol */}
                  {user.role === "customer" && (
                    <Link to="/my-orders" style={styles.profileMenuItem} role="menuitem"
                      onClick={() => setShowProfileMenu(false)}>
                      <span style={styles.profileMenuIcon} aria-hidden="true">📦</span>
                      <span>Mis pedidos</span>
                    </Link>
                  )}
                  {user.role === "restaurant" && (
                    <Link to="/restaurant-panel" style={styles.profileMenuItem} role="menuitem"
                      onClick={() => setShowProfileMenu(false)}>
                      <span style={styles.profileMenuIcon} aria-hidden="true">🍽️</span>
                      <span>Panel del restaurante</span>
                    </Link>
                  )}
                  {user.role === "admin" && (
                    <>
                      <Link to="/admin" style={styles.profileMenuItem} role="menuitem"
                        onClick={() => setShowProfileMenu(false)}>
                        <span style={styles.profileMenuIcon} aria-hidden="true">⚙️</span>
                        <span>Panel de administrador</span>
                      </Link>
                      <Link to="/my-orders" style={styles.profileMenuItem} role="menuitem"
                        onClick={() => setShowProfileMenu(false)}>
                        <span style={styles.profileMenuIcon} aria-hidden="true">📦</span>
                        <span>Mis pedidos</span>
                      </Link>
                    </>
                  )}

                  <div style={styles.profileMenuDivider} />

                  <button style={styles.profileMenuLogout} onClick={handleLogout} role="menuitem">
                    <span style={styles.profileMenuIcon} aria-hidden="true">🚪</span>
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.authLinks}>
              <Link to="/login" style={styles.loginBtn}>Entrar</Link>
              <Link to="/register" style={styles.registerBtn} className="qb-nav-register">Crear cuenta</Link>
            </div>
          )}
        </div>
      </nav>
    </div>
  )
}

export default Navbar

const styles = {
  wrapper: { position: "sticky", top: 0, zIndex: 100 },
  promoBanner: {
    background: "linear-gradient(90deg, #cc3700 0%, #ff4500 50%, #cc3700 100%)",
    color: "white", textAlign: "center", padding: "10px 24px",
    fontSize: "var(--fs-sm)", lineHeight: 1.4, minHeight: "40px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 500
  },
  promoText: { display: "block" },
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 44px", height: "76px", background: "var(--surface)",
    borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", gap: "20px"
  },
  logo: { display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 },
  logoIcon: { fontSize: "28px" },
  logoText: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "24px", color: "var(--brand)", letterSpacing: "-0.5px" },
  searchWrapper: { position: "relative", flex: "0 1 440px" },
  searchIcon: { position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", pointerEvents: "none", color: "var(--text-muted)" },
  search: { width: "100%", padding: "12px 44px 12px 44px", borderRadius: "100px", border: "2px solid var(--border)", background: "var(--surface2)", fontSize: "var(--fs-base)", outline: "none", color: "var(--text)", minHeight: "44px" },
  clearBtn: { position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "16px", padding: "4px", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center" },
  dropdown: {
    position: "absolute", top: "calc(100% + 10px)", left: 0, right: 0,
    background: "var(--surface)", borderRadius: "var(--radius)",
    border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)",
    overflow: "hidden", zIndex: 200
  },
  dropdownItem: {
    display: "flex", alignItems: "center", gap: "14px",
    padding: "14px 18px", width: "100%", border: "none",
    background: "transparent", cursor: "pointer", textAlign: "left",
    transition: "background 0.15s", fontFamily: "var(--font-body)",
    borderBottom: "1px solid var(--border)", minHeight: "60px"
  },
  dropdownImg: { width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 },
  dropdownInfo: { display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 },
  dropdownName: { fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  dropdownSub: { fontSize: "var(--fs-sm)", color: "var(--text-muted)" },
  actions: { display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 },
  cartBtn: { display: "flex", alignItems: "center", gap: "9px", padding: "12px 22px", borderRadius: "100px", textDecoration: "none", fontWeight: 600, fontSize: "var(--fs-base)", transition: "all 0.2s", cursor: "pointer", minHeight: "44px" },
  cartLabel: { fontWeight: 600, fontSize: "var(--fs-base)" },
  cartSep: { opacity: 0.7, fontSize: "var(--fs-sm)" },
  cartTotal: { fontWeight: 800, fontSize: "var(--fs-base)" },

  // Profile
  profileWrapper: { position: "relative" },
  avatarBtn: {
    display: "flex", alignItems: "center", gap: "10px",
    background: "var(--surface2)", border: "2px solid var(--border)",
    borderRadius: "100px", padding: "6px 16px 6px 6px",
    cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s",
    minHeight: "44px"
  },
  userAvatar: {
    width: "36px", height: "36px", borderRadius: "50%",
    background: "var(--brand)", color: "white",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: "var(--fs-base)", fontFamily: "var(--font-display)", flexShrink: 0
  },
  userName: { fontSize: "var(--fs-base)", color: "var(--text)", fontWeight: 600 },
  profileMenu: {
    position: "absolute", top: "calc(100% + 12px)", right: 0,
    background: "var(--surface)", borderRadius: "var(--radius)",
    border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)",
    minWidth: "280px", overflow: "hidden", zIndex: 300
  },
  profileMenuHeader: {
    display: "flex", alignItems: "center", gap: "14px",
    padding: "20px"
  },
  profileMenuAvatar: {
    width: "48px", height: "48px", borderRadius: "50%",
    background: "var(--brand)", color: "white",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: "20px", fontFamily: "var(--font-display)", flexShrink: 0
  },
  profileMenuName: { fontWeight: 700, fontSize: "var(--fs-md)", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  profileMenuEmail: { fontSize: "var(--fs-sm)", color: "var(--text-muted)", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  profileMenuDivider: { height: "1px", background: "var(--border)" },
  profileMenuItem: {
    display: "flex", alignItems: "center", gap: "14px",
    padding: "16px 20px", textDecoration: "none",
    color: "var(--text)", fontSize: "var(--fs-base)", fontWeight: 500,
    transition: "background 0.15s", cursor: "pointer",
    fontFamily: "var(--font-body)", minHeight: "var(--touch-min)"
  },
  profileMenuIcon: { fontSize: "20px", width: "26px", textAlign: "center" },
  profileMenuLogout: {
    display: "flex", alignItems: "center", gap: "14px",
    padding: "16px 20px", width: "100%", border: "none",
    background: "transparent", color: "var(--danger)",
    fontSize: "var(--fs-base)", fontWeight: 600, cursor: "pointer",
    fontFamily: "var(--font-body)", textAlign: "left",
    minHeight: "var(--touch-min)"
  },
  authLinks: { display: "flex", gap: "10px" },
  loginBtn: { padding: "10px 20px", borderRadius: "100px", border: "2px solid var(--border)", fontSize: "var(--fs-base)", fontWeight: 600, color: "var(--text)", textDecoration: "none", minHeight: "var(--touch-min)", display: "flex", alignItems: "center" },
  registerBtn: { padding: "10px 20px", borderRadius: "100px", background: "var(--brand)", color: "white", fontSize: "var(--fs-base)", fontWeight: 700, textDecoration: "none", minHeight: "var(--touch-min)", display: "flex", alignItems: "center" }
}
