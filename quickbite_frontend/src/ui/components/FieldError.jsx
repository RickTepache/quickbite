/**
 * FieldError — muestra el mensaje de error debajo de un input
 * inputStyle — estilo de input con borde rojo si hay error
 *
 * Tamaños subidos para mejor accesibilidad de baja visión.
 */

export function FieldError({ error }) {
  if (!error) return null
  return (
    <span
      role="alert"
      style={{
        fontSize: "var(--fs-sm)",
        color: "var(--danger)",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginTop: "6px",
        fontWeight: 600,
        lineHeight: 1.4
      }}
    >
      <span aria-hidden="true">⚠️</span> {error}
    </span>
  )
}

export function inputStyle(hasError) {
  return {
    padding: "14px 18px",
    borderRadius: "var(--radius-sm)",
    border: `2px solid ${hasError ? "#dc2626" : "var(--border)"}`,
    fontSize: "var(--fs-base)",
    outline: "none",
    fontFamily: "var(--font-body)",
    background: hasError ? "#fff5f5" : "var(--surface2)",
    color: "var(--text)",
    width: "100%",
    minHeight: "var(--touch-min)",
    transition: "border-color 0.2s, background 0.2s"
  }
}
