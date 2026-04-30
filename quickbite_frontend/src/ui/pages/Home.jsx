import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import RestaurantCard from "../components/RestaurantCard"
import OffersCarousel from "../components/OffersCarousel"
import Footer from "../components/Footer"
import { categories } from "../../data/mockData"
import { RestaurantRepository } from "../../infrastructure/repositories/RestaurantRepository"
import { GetRestaurantsUseCase } from "../../application/usecases/GetRestaurantsUseCase"

const restaurantRepository = new RestaurantRepository()
const getRestaurantsUseCase = new GetRestaurantsUseCase(restaurantRepository)

function Home() {
  const [activeCategory, setActiveCategory] = useState(null)
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const result = await getRestaurantsUseCase.execute(activeCategory)
        setFiltered(Array.isArray(result) ? result : [])
      } catch (err) {
        console.error('Error cargando restaurantes:', err.message)
        setFiltered([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeCategory])

  return (
    <div className="page-enter">
      <Navbar />

      {/* ── CARRUSEL — reemplaza el hero ── */}
      <OffersCarousel />

      {/* ── CONTENT ── */}
      <main style={styles.main} className="qb-home-main">

        {/* Categorías */}
        <section style={styles.section} aria-label="Categorías de comida">
          <div style={styles.categoriesGrid} className="qb-categories-grid">
            <button
              onClick={() => setActiveCategory(null)}
              aria-pressed={!activeCategory}
              style={{
                ...styles.catPill,
                background: !activeCategory ? "linear-gradient(135deg, #ff4500, #ff7043)" : "var(--surface)",
                color: !activeCategory ? "white" : "var(--text)",
                border: !activeCategory ? "none" : "2px solid var(--border)",
                boxShadow: !activeCategory ? "0 4px 14px rgba(255,69,0,0.35)" : "var(--shadow-sm)"
              }}
            >
              <span style={styles.catIcon} className="qb-cat-icon" aria-hidden="true">🍽️</span>
              <span style={styles.catName} className="qb-cat-name">Todos</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                aria-pressed={activeCategory === cat.name}
                style={{
                  ...styles.catPill,
                  background: activeCategory === cat.name ? "linear-gradient(135deg, #ff4500, #ff7043)" : "var(--surface)",
                  color: activeCategory === cat.name ? "white" : "var(--text)",
                  border: activeCategory === cat.name ? "none" : "2px solid var(--border)",
                  boxShadow: activeCategory === cat.name ? "0 4px 14px rgba(255,69,0,0.35)" : "var(--shadow-sm)"
                }}
              >
                <span style={styles.catIcon} className="qb-cat-icon" aria-hidden="true">{cat.icon}</span>
                <span style={styles.catName} className="qb-cat-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Restaurantes */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              {activeCategory ? activeCategory : "Restaurantes populares"}
            </h2>
            {!loading && (
              <span style={styles.countBadge}>{filtered.length} disponibles</span>
            )}
          </div>

          {loading ? (
            <div style={styles.empty} aria-live="polite">
              <div style={{ fontSize: "56px", marginBottom: "20px" }} aria-hidden="true">⏳</div>
              <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-md)" }}>Cargando restaurantes...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={styles.empty} role="status">
              <div style={{ fontSize: "56px", marginBottom: "20px" }} aria-hidden="true">🍽️</div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-xl)", fontWeight: 700, marginBottom: "10px" }}>Sin resultados</p>
              <p style={{ color: "var(--text-muted)", fontSize: "var(--fs-base)" }}>No hay restaurantes en esta categoría todavía.</p>
            </div>
          ) : (
            <div style={styles.grid} className="qb-restaurants-grid">
              {filtered.map((r, i) => (
                <div key={r.id} className="animate-fadeUp" style={{ animationDelay: `${i * 0.07}s` }}>
                  <RestaurantCard restaurant={r} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Home

const styles = {
  main: { maxWidth: "1280px", margin: "0 auto", padding: "0 44px 72px" },
  section: { paddingTop: "40px" },
  categoriesGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px" },
  catPill: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: "10px", padding: "22px 14px",
    borderRadius: "16px", cursor: "pointer", transition: "all 0.2s ease",
    fontFamily: "var(--font-body)", width: "100%",
    minHeight: "100px"
  },
  catIcon: { fontSize: "40px", lineHeight: 1 },
  catName: { fontSize: "var(--fs-base)", fontWeight: 600, letterSpacing: "-0.1px" },
  sectionHeader: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" },
  sectionTitle: { fontFamily: "var(--font-display)", fontSize: "var(--fs-2xl)", fontWeight: 800, letterSpacing: "-0.5px" },
  countBadge: {
    background: "var(--surface2)", color: "var(--text-muted)",
    padding: "5px 14px", borderRadius: "100px", fontSize: "var(--fs-sm)", fontWeight: 600
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" },
  empty: {
    textAlign: "center", padding: "96px 44px",
    background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)"
  }
}
