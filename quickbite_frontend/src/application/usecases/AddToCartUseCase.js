import { CartItem } from "../../domain/entities/CartItem"

/**
 * Caso de uso: agregar un producto al carrito.
 * Cada combinación única de producto + personalización crea una entrada separada.
 */
export class AddToCartUseCase {
  execute(cart, product) {
    const extrasPrice = product.extrasPrice || 0
    const customization = product.customization || null

    // Generar una clave que identifique esta combinación exacta de producto + extras
    const customKey = `${product.id}-${JSON.stringify(customization)}`
    const existing = cart.find(item => item.cartKey === customKey)

    if (existing) {
      return cart.map(item =>
        item.cartKey === customKey
          ? new CartItem({ ...item, quantity: item.quantity + product.quantity })
          : item
      )
    }

    return [...cart, new CartItem({
      ...product,
      extrasPrice,
      customization,
      cartKey: customKey,
      quantity: product.quantity || 1
    })]
  }
}
