import { useState, useEffect } from "react"
import { validateComments, validateQuantity } from "../../utils/validators"
import { FieldError } from "./FieldError"

// Opciones por categoría de platillo
const getOptions = (name) => {
  const n = name.toLowerCase()
  if (n.includes("hamburgues") || n.includes("burger") || n.includes("combo")) {
    return {
      ingredients: ["Pan brioche", "Carne de res", "Queso amarillo", "Lechuga", "Jitomate", "Cebolla", "Pepinillos", "Mayonesa", "Mostaza", "Ketchup"],
      extras: ["Extra queso +$15", "Doble carne +$25", "Tocino +$20", "Aguacate +$15"],
      remove: ["Pepinillos", "Cebolla", "Jitomate", "Lechuga", "Mostaza", "Mayonesa"],
      spicy: true
    }
  }
  if (n.includes("pizza")) {
    return {
      ingredients: ["Masa de harina", "Salsa de tomate", "Queso mozzarella", "Pepperoni", "Orégano", "Aceite de oliva"],
      extras: ["Extra queso +$20", "Orilla rellena +$25", "Doble porción +$30"],
      remove: ["Cebolla", "Pimiento", "Champiñones", "Aceitunas"],
      spicy: false
    }
  }
  if (n.includes("taco") || n.includes("birria")) {
    return {
      ingredients: ["Tortilla de maíz", "Carne de birria", "Cebolla", "Cilantro", "Salsa roja", "Salsa verde", "Limón"],
      extras: ["Extra carne +$20", "Queso fundido +$15", "Guacamole +$10"],
      remove: ["Cebolla", "Cilantro", "Salsa roja", "Salsa verde"],
      spicy: true
    }
  }
  if (n.includes("sushi") || n.includes("roll") || n.includes("nigiri")) {
    return {
      ingredients: ["Arroz de sushi", "Alga nori", "Salmón fresco", "Aguacate", "Pepino", "Queso crema", "Cebollín", "Ajonjolí"],
      extras: ["Extra aguacate +$15", "Extra salmón +$25", "Salsa spicy +$10"],
      remove: ["Pepino", "Aguacate", "Queso crema", "Cebollín"],
      spicy: true
    }
  }
  if (n.includes("pasta") || n.includes("espagueti")) {
    return {
      ingredients: ["Pasta", "Salsa marinara", "Queso parmesano", "Ajo", "Albahaca", "Aceite de oliva"],
      extras: ["Extra queso +$15", "Pollo a la plancha +$25", "Pan de ajo +$20"],
      remove: ["Ajo", "Albahaca", "Queso parmesano"],
      spicy: false
    }
  }
  return {
    ingredients: [],
    extras: [],
    remove: [],
    spicy: false
  }
}

function ProductModal({ item, onClose, onAdd }) {
  const options = getOptions(item.name)
  const [quantity, setQuantity] = useState(1)
  const [selectedExtras, setSelectedExtras] = useState([])
  const [removedItems, setRemovedItems] = useState([])
  const [removedIngredients, setRemovedIngredients] = useState([])
  const [spicy, setSpicy] = useState("normal")
  const [comments, setComments] = useState("")
  const [commentError, setCommentError] = useState("")

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  const handleCommentChange = (e) => {
    const val = e.target.value
    setComments(val)
    const r = validateComments(val)
    setCommentError(r.error)
  }

  const changeQuantity = (delta) => {
    const newQty = quantity + delta
    const r = validateQuantity(newQty)
    if (r.valid) setQuantity(newQty)
  }

  const toggleExtra = (extra) => {
    setSelectedExtras(prev =>
      prev.includes(extra) ? prev.filter(e => e !== extra) : [...prev, extra]
    )
  }

  const toggleIngredient = (ing) => {
    setRemovedIngredients(prev =>
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    )
  }

  const toggleRemove = (item) => {
    setRemovedItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    )
  }

  const extrasPrice = selectedExtras.reduce((sum, e) => {
    const match = e.match(/\+\$(\d+)/)
    return sum + (match ? parseInt(match[1]) : 0)
  }, 0)

  const unitPrice = item.price + extrasPrice
  const totalPrice = unitPrice * quantity

  const handleAdd = () => {
    const commentValidation = validateComments(comments)
    if (!commentValidation.valid) { setCommentError(commentValidation.error); return }
    const customization = {
      extras: selectedExtras,
      removed: [...removedItems, ...removedIngredients],
      spicy: options.spicy ? spicy : null,
      comments: comments.trim()
    }
    onAdd({ ...item, extrasPrice, customization, quantity })
    onClose()
  }

  return (
    <div style={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-labelledby="pm-title">
      <div style={styles.modal} className="qb-modal">

        {/* Header */}
        <div style={styles.header}>
          <img src={item.image} alt="" style={styles.img} />
          <div style={styles.overlay} />
          <button style={styles.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>
          <div style={styles.headerInfo}>
            <h2 id="pm-title" style={styles.itemName}>{item.name}</h2>
            <p style={styles.itemPrice}>${item.price} MXN</p>
          </div>
        </div>

        {/* Body */}
        <div style={styles.body}>

          {/* Quantity */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Cantidad</h3>
            <div style={styles.qtyRow}>
              <button style={styles.qtyBtn} onClick={() => changeQuantity(-1)} aria-label="Reducir cantidad">−</button>
              <span style={styles.qtyNum} aria-label={`Cantidad: ${quantity}`}>{quantity}</span>
              <button style={{ ...styles.qtyBtn, ...styles.qtyBtnAdd }} onClick={() => changeQuantity(1)} aria-label="Aumentar cantidad">+</button>
            </div>
          </div>

          {/* Ingredientes */}
          {options.ingredients && options.ingredients.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <span aria-hidden="true">🧾</span> Ingredientes
                <span style={styles.optional}>Toca para quitar</span>
              </h3>
              <div style={styles.ingredientsList}>
                {options.ingredients.map(ing => {
                  const removed = removedIngredients.includes(ing)
                  return (
                    <button
                      key={ing}
                      onClick={() => toggleIngredient(ing)}
                      aria-pressed={removed}
                      style={{
                        ...styles.ingredientChip,
                        background: removed ? "#fef2f2" : "#f0fdf4",
                        color: removed ? "var(--danger)" : "#166534",
                        border: removed ? "2px solid #fecaca" : "2px solid #bbf7d0",
                        textDecoration: removed ? "line-through" : "none",
                        opacity: removed ? 0.7 : 1
                      }}
                    >
                      {removed ? "✕ " : "✓ "}{ing}
                    </button>
                  )
                })}
              </div>
              {removedIngredients.length > 0 && (
                <p style={styles.removedNote}>
                  Sin: {removedIngredients.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* Extras */}
          {options.extras.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>¿Algo extra? <span style={styles.optional}>Opcional</span></h3>
              <div style={styles.extrasGrid}>
                {options.extras.map(extra => (
                  <button
                    key={extra}
                    onClick={() => toggleExtra(extra)}
                    aria-pressed={selectedExtras.includes(extra)}
                    style={{
                      ...styles.extraCard,
                      background: selectedExtras.includes(extra) ? "var(--brand)" : "var(--surface2)",
                      color: selectedExtras.includes(extra) ? "white" : "var(--text)",
                      border: selectedExtras.includes(extra) ? "2px solid var(--brand)" : "2px solid var(--border)",
                      boxShadow: selectedExtras.includes(extra) ? "0 4px 14px rgba(255,69,0,0.25)" : "none"
                    }}
                  >
                    <span style={styles.extraIcon} aria-hidden="true">{selectedExtras.includes(extra) ? "✓" : "+"}</span>
                    <span style={styles.extraLabel}>{extra}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Remove items */}
          {options.remove.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>¿Quitar algo? <span style={styles.optional}>Opcional</span></h3>
              <div style={styles.optionsList}>
                {options.remove.map(ing => (
                  <button
                    key={ing}
                    onClick={() => toggleRemove(ing)}
                    aria-pressed={removedItems.includes(ing)}
                    style={{
                      ...styles.optionChip,
                      background: removedItems.includes(ing) ? "#fef2f2" : "var(--surface2)",
                      color: removedItems.includes(ing) ? "var(--danger)" : "var(--text)",
                      border: removedItems.includes(ing) ? "2px solid #fecaca" : "2px solid var(--border)",
                      textDecoration: removedItems.includes(ing) ? "line-through" : "none"
                    }}
                  >
                    {removedItems.includes(ing) ? "✕ " : ""}{ing}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Spicy level */}
          {options.spicy && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Nivel de picante</h3>
              <div style={styles.spicyRow}>
                {[
                  { value: "sin", label: "Sin picante", icon: "😌" },
                  { value: "normal", label: "Normal", icon: "🌶" },
                  { value: "extra", label: "Extra picante", icon: "🔥" }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSpicy(opt.value)}
                    aria-pressed={spicy === opt.value}
                    style={{
                      ...styles.spicyBtn,
                      background: spicy === opt.value ? "var(--brand)" : "var(--surface2)",
                      color: spicy === opt.value ? "white" : "var(--text)",
                      border: spicy === opt.value ? "2px solid var(--brand)" : "2px solid var(--border)"
                    }}
                  >
                    <span style={{ fontSize: "26px" }} aria-hidden="true">{opt.icon}</span>
                    <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Comentarios <span style={styles.optional}>Opcional · máx. 200 caracteres</span></h3>
            <textarea
              style={{ ...styles.textarea, border: commentError ? "2px solid #dc2626" : "2px solid var(--border)", background: commentError ? "#fff5f5" : "var(--surface2)" }}
              placeholder="Ej: sin sal, bien cocido, salsa aparte..."
              value={comments}
              onChange={handleCommentChange}
              rows={3}
              maxLength={200}
              aria-invalid={!!commentError}
            />
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:"6px", alignItems:"center" }}>
              <FieldError error={commentError} />
              <span style={{ fontSize:"var(--fs-sm)", color: comments.length > 180 ? "var(--warning)" : "var(--text-muted)" }}>{comments.length}/200</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.priceBreakdown}>
            {extrasPrice > 0 && (
              <span style={styles.extrasNote}>+${extrasPrice} en extras</span>
            )}
            <span style={styles.totalPrice}>${totalPrice} MXN</span>
          </div>
          <button style={styles.addBtn} onClick={handleAdd}>
            Agregar {quantity > 1 ? `(${quantity})` : ""} al carrito →
          </button>
        </div>

      </div>
    </div>
  )
}

export default ProductModal

const styles = {
  backdrop: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.65)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    backdropFilter: "blur(4px)",
    animation: "fadeIn 0.2s ease"
  },
  modal: {
    background: "var(--surface)",
    borderRadius: "var(--radius)",
    width: "100%",
    maxWidth: "560px",
    maxHeight: "92vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "var(--shadow-lg)",
    animation: "fadeUp 0.25s ease"
  },
  header: {
    position: "relative",
    height: "220px",
    flexShrink: 0,
    overflow: "hidden"
  },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  overlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 60%)"
  },
  closeBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "rgba(255,255,255,0.97)",
    border: "none",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text)",
    fontWeight: 700,
    boxShadow: "var(--shadow)"
  },
  headerInfo: {
    position: "absolute",
    bottom: "20px",
    left: "24px",
    right: "24px",
    color: "white"
  },
  itemName: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-xl)",
    fontWeight: 800,
    marginBottom: "8px",
    letterSpacing: "-0.5px"
  },
  itemPrice: {
    fontSize: "var(--fs-md)",
    fontWeight: 700,
    color: "rgba(255,255,255,0.95)"
  },

  body: {
    padding: "24px 28px",
    overflowY: "auto",
    flex: 1
  },
  section: { marginBottom: "26px" },
  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-base)",
    fontWeight: 800,
    marginBottom: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    letterSpacing: "-0.2px"
  },
  optional: {
    fontSize: "var(--fs-sm)",
    fontWeight: 500,
    color: "var(--text-muted)",
    marginLeft: "auto"
  },

  // Quantity
  qtyRow: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    background: "var(--surface2)",
    padding: "10px",
    borderRadius: "100px",
    width: "fit-content",
    border: "1px solid var(--border)"
  },
  qtyBtn: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "none",
    background: "var(--surface)",
    fontSize: "22px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text)",
    lineHeight: 1,
    boxShadow: "var(--shadow-sm)",
    transition: "all 0.15s"
  },
  qtyBtnAdd: {
    background: "var(--brand)",
    color: "white"
  },
  qtyNum: {
    fontSize: "var(--fs-xl)",
    fontWeight: 800,
    minWidth: "32px",
    textAlign: "center",
    fontFamily: "var(--font-display)"
  },

  // Ingredientes
  ingredientsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  ingredientChip: {
    padding: "10px 14px",
    borderRadius: "100px",
    cursor: "pointer",
    fontSize: "var(--fs-sm)",
    fontWeight: 600,
    transition: "all 0.15s",
    fontFamily: "var(--font-body)",
    minHeight: "var(--touch-min)"
  },
  removedNote: {
    marginTop: "10px",
    fontSize: "var(--fs-sm)",
    color: "var(--danger)",
    fontWeight: 600,
    background: "#fef2f2",
    padding: "8px 14px",
    borderRadius: "var(--radius-sm)",
    border: "2px solid #fecaca"
  },

  // Extras
  extrasGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
  },
  extraCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 16px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    transition: "all 0.2s",
    textAlign: "left",
    minHeight: "var(--touch-min)"
  },
  extraIcon: {
    fontSize: "18px",
    fontWeight: 700,
    width: "22px",
    flexShrink: 0
  },
  extraLabel: {
    fontSize: "var(--fs-sm)",
    fontWeight: 600,
    flex: 1
  },

  // Remove options
  optionsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  optionChip: {
    padding: "10px 16px",
    borderRadius: "100px",
    cursor: "pointer",
    fontSize: "var(--fs-sm)",
    fontWeight: 600,
    transition: "all 0.15s",
    fontFamily: "var(--font-body)",
    minHeight: "var(--touch-min)"
  },

  // Spicy
  spicyRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px"
  },
  spicyBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "16px 12px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    transition: "all 0.2s",
    minHeight: "80px"
  },

  // Textarea
  textarea: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "var(--radius-sm)",
    background: "var(--surface2)",
    fontSize: "var(--fs-base)",
    fontFamily: "var(--font-body)",
    resize: "vertical",
    minHeight: "84px",
    outline: "none",
    color: "var(--text)"
  },

  // Footer
  footer: {
    padding: "20px 28px",
    borderTop: "1px solid var(--border)",
    background: "var(--surface)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    flexShrink: 0
  },
  priceBreakdown: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  extrasNote: {
    fontSize: "var(--fs-sm)",
    color: "var(--brand)",
    fontWeight: 700
  },
  totalPrice: {
    fontFamily: "var(--font-display)",
    fontSize: "var(--fs-xl)",
    fontWeight: 800,
    color: "var(--text)",
    marginLeft: "auto"
  },
  addBtn: {
    background: "var(--brand)",
    color: "white",
    border: "none",
    padding: "16px",
    borderRadius: "var(--radius-sm)",
    fontWeight: 700,
    fontSize: "var(--fs-md)",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    transition: "background 0.2s",
    minHeight: "52px"
  }
}
