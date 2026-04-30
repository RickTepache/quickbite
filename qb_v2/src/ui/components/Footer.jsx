import { Link } from "react-router-dom"

function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner} className="qb-footer-inner">

        {/* Brand */}
        <div style={styles.brand} className="qb-footer-brand">
          <div style={styles.logo}>
            <span style={{ fontSize: "32px" }} aria-hidden="true">🍔</span>
            <span style={styles.logoText}>QuickBite</span>
          </div>
          <p style={styles.tagline}>
            Los mejores restaurantes de tu ciudad, directo a tu puerta.
          </p>
          <div style={styles.socials}>
            <a href="#" style={styles.social} aria-label="Facebook"><span aria-hidden="true">📘</span></a>
            <a href="#" style={styles.social} aria-label="Instagram"><span aria-hidden="true">📸</span></a>
            <a href="#" style={styles.social} aria-label="Twitter"><span aria-hidden="true">🐦</span></a>
            <a href="#" style={styles.social} aria-label="YouTube"><span aria-hidden="true">▶️</span></a>
          </div>
        </div>

        {/* Links */}
        <div style={styles.col}>
          <h4 style={styles.colTitle}>Explorar</h4>
          <Link to="/" style={styles.link}>Inicio</Link>
          <Link to="/" style={styles.link}>Restaurantes</Link>
          <Link to="/cart" style={styles.link}>Mi carrito</Link>
          <Link to="/login" style={styles.link}>Iniciar sesión</Link>
          <Link to="/register" style={styles.link}>Crear cuenta</Link>
        </div>

        <div style={styles.col}>
          <h4 style={styles.colTitle}>Categorías</h4>
          <Link to="/" style={styles.link}>🍕 Pizza</Link>
          <Link to="/" style={styles.link}>🍔 Hamburguesas</Link>
          <Link to="/" style={styles.link}>🌮 Tacos</Link>
          <Link to="/" style={styles.link}>🍣 Sushi</Link>
          <Link to="/" style={styles.link}>🍰 Postres</Link>
        </div>

        <div style={styles.col}>
          <h4 style={styles.colTitle}>Contacto</h4>
          <p style={styles.contactItem}><span aria-hidden="true">📍</span> Tuxtla Gutiérrez, Chiapas</p>
          <p style={styles.contactItem}><span aria-hidden="true">📞</span> +52 961 000 0000</p>
          <p style={styles.contactItem}><span aria-hidden="true">✉️</span> hola@quickbite.mx</p>
          <p style={styles.contactItem}><span aria-hidden="true">🕐</span> Lun–Dom · 8am–11pm</p>
        </div>

      </div>

      {/* Bottom bar */}
      <div style={styles.bottom} className="qb-footer-bottom">
        <p style={styles.copy}>© 2025 QuickBite. Todos los derechos reservados.</p>
        <div style={styles.bottomLinks}>
          <a href="#" style={styles.bottomLink}>Privacidad</a>
          <a href="#" style={styles.bottomLink}>Términos</a>
          <a href="#" style={styles.bottomLink}>Cookies</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer

const styles = {
  footer: {
    background: "#0f0a00",
    borderTop: "1px solid rgba(255,255,255,0.08)"
  },
  inner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "64px 44px 44px",
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
    gap: "52px"
  },
  brand: {},
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px"
  },
  logoText: {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "28px",
    color: "var(--brand)",
    letterSpacing: "-0.5px"
  },
  tagline: {
    color: "rgba(255,255,255,0.65)",
    fontSize: "var(--fs-base)",
    lineHeight: 1.6,
    marginBottom: "24px",
    maxWidth: "300px"
  },
  socials: { display: "flex", gap: "12px" },
  social: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    textDecoration: "none",
    transition: "background 0.2s"
  },
  col: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  colTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-sm)",
    fontWeight: 800,
    color: "white",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    marginBottom: "6px"
  },
  link: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "var(--fs-base)",
    textDecoration: "none",
    transition: "color 0.2s",
    minHeight: "32px",
    display: "flex",
    alignItems: "center"
  },
  contactItem: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "var(--fs-base)",
    lineHeight: 1.7
  },
  bottom: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px 44px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  copy: {
    color: "rgba(255,255,255,0.45)",
    fontSize: "var(--fs-sm)"
  },
  bottomLinks: { display: "flex", gap: "24px" },
  bottomLink: {
    color: "rgba(255,255,255,0.45)",
    fontSize: "var(--fs-sm)",
    textDecoration: "none"
  }
}
