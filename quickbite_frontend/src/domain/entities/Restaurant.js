/**
 * Restaurant.js — Entidad de dominio
 *
 * CORRECCIÓN: El backend devuelve los campos en snake_case
 * (delivery_time, pickup_time, review_count, min_order, address, hours).
 * El constructor ahora acepta ambas formas para ser compatible tanto con
 * la respuesta del backend como con los datos mock en camelCase.
 */
export class Restaurant {
  constructor(data) {
    this.id           = data.id
    this.name         = data.name
    this.category     = data.category
    this.rating       = data.rating
    this.reviewCount  = data.reviewCount  ?? data.review_count  ?? 0
    this.deliveryTime = data.deliveryTime ?? data.delivery_time ?? '25-35 min'
    this.pickupTime   = data.pickupTime   ?? data.pickup_time   ?? '10-15 min'
    this.minOrder     = data.minOrder     ?? data.min_order     ?? 0
    this.badge        = data.badge        ?? null
    this.image        = data.image        ?? null
    this.address      = data.address      ?? ''
    this.hours        = data.hours        ?? ''
    this.active       = data.active       ?? true
  }
}
