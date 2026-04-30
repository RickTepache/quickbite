import { createContext, useContext, useState } from "react"
import { AddToCartUseCase } from "../../application/usecases/AddToCartUseCase"

const CartContext = createContext()
const addToCartUseCase = new AddToCartUseCase()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [conflict, setConflict] = useState(null) // { product, currentRestaurantName, newRestaurantName }

  const addToCart = (product) => {
    // Si el carrito está vacío, agregar directamente
    if (cart.length === 0) {
      setCart(prev => addToCartUseCase.execute(prev, product))
      return
    }

    // Verificar si el producto es de un restaurante diferente
    const currentRestaurantId = cart[0].restaurantId
    if (product.restaurantId && product.restaurantId !== currentRestaurantId) {
      // Mostrar diálogo de confirmación
      setConflict({ product })
      return
    }

    setCart(prev => addToCartUseCase.execute(prev, product))
  }

  const resolveConflict = (confirm) => {
    if (confirm && conflict) {
      // Vaciar carrito y agregar el nuevo producto
      setCart(addToCartUseCase.execute([], conflict.product))
    }
    setConflict(null)
  }

  const removeFromCart = (cartKey) => {
    setCart(prev => prev.filter(item => item.cartKey !== cartKey))
  }

  const updateQuantity = (cartKey, quantity) => {
    if (quantity < 1) return removeFromCart(cartKey)
    setCart(prev =>
      prev.map(item => item.cartKey === cartKey ? { ...item, quantity } : item)
    )
  }

  const clearCart = () => setCart([])

  const total = cart.reduce((sum, item) => sum + (item.price + (item.extrasPrice || 0)) * item.quantity, 0)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total, itemCount }}>
      {children}

      {/* Diálogo de conflicto de restaurante */}
      {conflict && (
        <div style={S.backdrop}>
          <div style={S.dialog}>
            <div style={S.dialogIcon}>🛒</div>
            <h2 style={S.dialogTitle}>¿Iniciar nuevo pedido?</h2>
            <p style={S.dialogText}>
              Tu carrito tiene productos de otro restaurante. Si continúas, se vaciará el carrito actual y empezarás uno nuevo.
            </p>
            <div style={S.dialogBtns}>
              <button style={S.cancelBtn} onClick={() => resolveConflict(false)}>
                Cancelar
              </button>
              <button style={S.confirmBtn} onClick={() => resolveConflict(true)}>
                Vaciar y continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)

const S = {
  backdrop: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 2000,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "20px", backdropFilter: "blur(4px)"
  },
  dialog: {
    background: "var(--surface)",
    borderRadius: "var(--radius)",
    padding: "32px 28px",
    maxWidth: "400px", width: "100%",
    textAlign: "center",
    boxShadow: "var(--shadow-lg)"
  },
  dialogIcon: { fontSize: "48px", marginBottom: "16px" },
  dialogTitle: {
    fontFamily: "var(--font-display)", fontSize: "20px",
    fontWeight: 800, marginBottom: "10px", letterSpacing: "-0.3px"
  },
  dialogText: {
    color: "var(--text-muted)", fontSize: "14px",
    lineHeight: 1.6, marginBottom: "24px"
  },
  dialogBtns: { display: "flex", gap: "12px" },
  cancelBtn: {
    flex: 1, padding: "12px",
    border: "1.5px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    background: "transparent", cursor: "pointer",
    fontWeight: 600, fontSize: "14px",
    fontFamily: "var(--font-body)", color: "var(--text)"
  },
  confirmBtn: {
    flex: 1, padding: "12px",
    background: "var(--brand)", color: "white",
    border: "none", borderRadius: "var(--radius-sm)",
    cursor: "pointer", fontWeight: 700,
    fontSize: "14px", fontFamily: "var(--font-body)"
  }
}
