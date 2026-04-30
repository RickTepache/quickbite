import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

/**
 * ProtectedRoute — Protege rutas por autenticación y rol.
 *
 * Uso sin rol:     <ProtectedRoute> — solo requiere estar logueado
 * Uso con rol:     <ProtectedRoute allowedRoles={["admin"]}> — requiere rol específico
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  // Esperar a que el AuthContext termine de restaurar la sesión
  if (loading) {
    return (
      <div style={styles.loading} role="status" aria-live="polite">
        <div style={styles.spinner} aria-hidden="true" />
        <p style={styles.text}>Verificando sesión...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute

const styles = {
  loading: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
    background: "var(--bg)"
  },
  spinner: {
    width: "52px",
    height: "52px",
    border: "5px solid var(--border)",
    borderTop: "5px solid var(--brand)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  text: {
    color: "var(--text-muted)",
    fontSize: "var(--fs-md)",
    fontWeight: 500
  }
}
