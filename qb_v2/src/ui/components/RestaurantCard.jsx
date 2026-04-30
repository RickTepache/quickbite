import { Link } from "react-router-dom"

const badgeColors = {
  "Popular":    { bg: "#fef9c3", color: "#854d0e" },
  "Más pedido": { bg: "#dcfce7", color: "#166534" },
  "Nuevo":      { bg: "#ede9fe", color: "#5b21b6" },
}

function RestaurantCard({ restaurant }) {
  const badge = restaurant.badge ? badgeColors[restaurant.badge] : null

  return (
    <Link to={`/restaurant/${restaurant.id}`} style={{ textDecoration: "none", display: "block" }} aria-label={`Ver ${restaurant.name}, ${restaurant.category}, ${restaurant.deliveryTime}, ${restaurant.rating} estrellas`}>
      <div className="restaurant-card" style={styles.card}>

        {/* Large image */}
        <div style={styles.imageWrapper} className="qb-card-image-wrapper">
          <img src={restaurant.image} alt="" className="card-image" style={styles.image} />
          <div style={styles.imageOverlay} />

          {/* Badge top-left */}
          {badge && (
            <span style={{ ...styles.badge, background: badge.bg, color: badge.color }}>
              {restaurant.badge}
            </span>
          )}

          {/* Rating top-right */}
          <span style={styles.ratingBadge} aria-label={`${restaurant.rating} estrellas`}>
            <span aria-hidden="true">⭐</span> {restaurant.rating}
          </span>

          {/* Bottom info over image */}
          <div style={styles.imageBottom}>
            <h3 style={styles.name}>{restaurant.name}</h3>
            <div style={styles.imageMeta}>
              <span style={styles.metaChip}><span aria-hidden="true">⏱</span> {restaurant.deliveryTime}</span>
              <span style={styles.metaChip}>{restaurant.category}</span>
            </div>
          </div>
        </div>

        {/* Slim footer */}
        <div style={styles.footer}>
          <span style={styles.reviews}><span aria-hidden="true">👥</span> {restaurant.reviewCount} reseñas</span>
          <span style={styles.cta}>Ver menú →</span>
        </div>

      </div>
    </Link>
  )
}

export default RestaurantCard

const styles = {
  card: {
    background: "var(--surface)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-sm)",
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
    cursor: "pointer"
  },
  imageWrapper: {
    position: "relative",
    height: "300px",
    overflow: "hidden"
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.4s ease"
  },
  imageOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, transparent 35%, rgba(0,0,0,0.78) 100%)"
  },
  badge: {
    position: "absolute",
    top: "14px",
    left: "14px",
    padding: "6px 14px",
    borderRadius: "100px",
    fontSize: "var(--fs-sm)",
    fontWeight: 700,
    letterSpacing: "0.2px"
  },
  ratingBadge: {
    position: "absolute",
    top: "14px",
    right: "14px",
    background: "rgba(255,255,255,0.97)",
    color: "#1a1a1a",
    padding: "6px 14px",
    borderRadius: "100px",
    fontSize: "var(--fs-sm)",
    fontWeight: 700,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
  },
  imageBottom: {
    position: "absolute",
    bottom: "16px",
    left: "16px",
    right: "16px"
  },
  name: {
    fontFamily: "var(--font-display)",
    fontSize: "26px",
    fontWeight: 800,
    color: "white",
    letterSpacing: "-0.5px",
    marginBottom: "10px",
    textShadow: "0 1px 4px rgba(0,0,0,0.5)"
  },
  imageMeta: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },
  metaChip: {
    background: "rgba(255,255,255,0.22)",
    color: "white",
    padding: "5px 12px",
    borderRadius: "100px",
    fontSize: "var(--fs-sm)",
    fontWeight: 600,
    backdropFilter: "blur(6px)"
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px"
  },
  reviews: {
    fontSize: "var(--fs-sm)",
    color: "var(--text-muted)",
    fontWeight: 500
  },
  cta: {
    fontSize: "var(--fs-base)",
    color: "var(--brand)",
    fontWeight: 700
  }
}
