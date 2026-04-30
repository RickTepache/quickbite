export class CartItem {
  constructor({ id, name, price, image, quantity = 1, extrasPrice = 0, customization = null, cartKey = null, restaurantId = null }) {
    this.id = id
    this.name = name
    this.price = price
    this.extrasPrice = extrasPrice
    this.image = image
    this.quantity = quantity
    this.customization = customization
    this.restaurantId = restaurantId   // ← necesario para identificar el restaurante en el checkout
    this.cartKey = cartKey || `${id}-${Date.now()}`
  }

  get unitTotal() {
    return this.price + this.extrasPrice
  }

  get subtotal() {
    return this.unitTotal * this.quantity
  }
}
