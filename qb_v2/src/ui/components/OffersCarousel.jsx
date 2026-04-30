import { useState, useEffect } from "react"
import { Link } from "react-router-dom"

const OFFERS = [
  {
    id: 1,
    tag: "⚡ Oferta del día",
    title: "20% OFF en todas las pizzas",
    subtitle: "Solo hoy — válido hasta medianoche",
    cta: "Ver Pizza House",
    link: "/restaurant/2",
    bg: "linear-gradient(135deg, #1a0500 0%, #3d0f00 50%, #1a0500 100%)",
    accent: "#ff4500",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
    badge: "AHORRA $30"
  },
  {
    id: 2,
    tag: "🔥 Lo más pedido",
    title: "Burger Town — La favorita de todos",
    subtitle: "519 pedidos esta semana · Entrega en 20 min",
    cta: "Pedir ahora",
    link: "/restaurant/1",
    bg: "linear-gradient(135deg, #0a0f1a 0%, #0f2040 50%, #0a0f1a 100%)",
    accent: "#3b82f6",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80",
    badge: "MÁS POPULAR"
  },
  {
    id: 3,
    tag: "🎁 Nuevo cliente",
    title: "Tu primer envío es GRATIS",
    subtitle: "Regístrate y recibe envío gratis en tu primer pedido",
    cta: "Crear cuenta",
    link: "/register",
    bg: "linear-gradient(135deg, #0a1a0a 0%, #0f3020 50%, #0a1a0a 100%)",
    accent: "#22c55e",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
    badge: "ENVÍO GRATIS"
  },
  {
    id: 4,
    tag: "🍣 Fin de semana",
    title: "Sushi Go — Fresco y delicioso",
    subtitle: "Los mejores rolls de la ciudad · Desde $180 MXN",
    cta: "Ver menú",
    link: "/restaurant/3",
    bg: "linear-gradient(135deg, #1a0a1a 0%, #2d0a3d 50%, #1a0a1a 100%)",
    accent: "#a855f7",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80",
    badge: "RECOMENDADO"
  }
]

function OffersCarousel() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  const goTo = (index) => {
    if (animating || index === current) return
    setAnimating(true)
    setTimeout(() => {
      setCurrent(index)
      setAnimating(false)
    }, 250)
  }

  const next = () => goTo((current + 1) % OFFERS.length)
  const prev = () => goTo((current - 1 + OFFERS.length) % OFFERS.length)

  // Auto-advance every 6 seconds (un poco más lento para baja visión)
  useEffect(() => {
    const timer = setInterval(next, 6000)
    return () => clearInterval(timer)
  }, [current])

  const offer = OFFERS[current]

  return (
    <div style={styles.wrapper} aria-roledescription="carrusel" aria-label="Ofertas destacadas">
      <div style={{ ...styles.slide, background: offer.bg }} className="qb-carousel">
        {/* Background image */}
        <div style={{ ...styles.bgImg, backgroundImage: `url(${offer.image})` }} />
        <div style={styles.bgOverlay} />

        {/* Content */}
        <div
          style={{
            ...styles.content,
            opacity: animating ? 0 : 1,
            transform: animating ? "translateY(10px)" : "translateY(0)",
            transition: "opacity 0.25s ease, transform 0.25s ease"
          }}
          className="qb-carousel-content"
        >
          <div style={styles.left}>
            <span style={{ ...styles.tag, color: offer.accent, borderColor: offer.accent, background: `${offer.accent}25` }}>
              {offer.tag}
            </span>
            <h2 style={styles.title} className="qb-carousel-title">{offer.title}</h2>
            <p style={styles.subtitle} className="qb-carousel-subtitle">{offer.subtitle}</p>
            <Link
              to={offer.link}
              style={{ ...styles.cta, background: offer.accent, boxShadow: `0 8px 24px ${offer.accent}50` }}
              className="qb-carousel-cta"
            >
              {offer.cta} →
            </Link>
          </div>

          <div style={styles.right} className="qb-carousel-right">
            <div style={styles.imageWrapper}>
              <img src={offer.image} alt="" style={styles.offerImg} />
              <div style={{ ...styles.badgeLabel, background: offer.accent }}>
                {offer.badge}
              </div>
            </div>
          </div>
        </div>

        {/* Prev / Next buttons */}
        <button style={{ ...styles.arrow, left: "24px" }} onClick={prev} className="qb-carousel-arrows" aria-label="Oferta anterior">‹</button>
        <button style={{ ...styles.arrow, right: "24px" }} onClick={next} className="qb-carousel-arrows" aria-label="Siguiente oferta">›</button>

        {/* Dots */}
        <div style={styles.dots}>
          {OFFERS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ir a oferta ${i + 1} de ${OFFERS.length}`}
              aria-current={i === current}
              style={{
                ...styles.dot,
                background: i === current ? "white" : "rgba(255,255,255,0.45)",
                width: i === current ? "32px" : "12px"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default OffersCarousel

const styles = {
  wrapper: { width: "100%", overflow: "hidden" },
  slide: {
    position: "relative",
    height: "500px",
    overflow: "hidden"
  },
  bgImg: {
    position: "absolute", inset: 0,
    backgroundSize: "cover", backgroundPosition: "center",
    opacity: 0.14
  },
  bgOverlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 100%)"
  },
  content: {
    position: "relative", zIndex: 1,
    maxWidth: "1200px", margin: "0 auto",
    padding: "0 88px",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "44px"
  },
  left: { flex: 1, maxWidth: "580px" },
  tag: {
    display: "inline-block",
    padding: "8px 18px",
    borderRadius: "100px",
    fontSize: "var(--fs-sm)",
    fontWeight: 700,
    border: "1px solid",
    letterSpacing: "0.3px",
    marginBottom: "20px"
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-3xl)",
    fontWeight: 800,
    color: "white",
    lineHeight: 1.1,
    letterSpacing: "-1px",
    marginBottom: "16px"
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "var(--fs-md)",
    marginBottom: "32px",
    lineHeight: 1.5
  },
  cta: {
    display: "inline-block",
    color: "white",
    padding: "16px 36px",
    borderRadius: "100px",
    fontWeight: 700,
    fontSize: "var(--fs-base)",
    textDecoration: "none",
    transition: "transform 0.2s, box-shadow 0.2s",
    minHeight: "var(--touch-min)"
  },
  right: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  imageWrapper: { position: "relative" },
  offerImg: {
    width: "380px",
    height: "360px",
    borderRadius: "24px",
    objectFit: "cover",
    boxShadow: "0 20px 60px rgba(0,0,0,0.55)"
  },
  badgeLabel: {
    position: "absolute",
    top: "-14px",
    right: "-14px",
    color: "white",
    fontSize: "var(--fs-xs)",
    fontWeight: 800,
    padding: "8px 14px",
    borderRadius: "100px",
    letterSpacing: "0.5px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
  },
  arrow: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.22)",
    border: "none",
    color: "white",
    fontSize: "32px",
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)",
    transition: "background 0.2s",
    zIndex: 2,
    lineHeight: 1
  },
  dots: {
    position: "absolute",
    bottom: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "8px",
    alignItems: "center"
  },
  dot: {
    height: "12px",
    borderRadius: "100px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    padding: 0
  }
}
