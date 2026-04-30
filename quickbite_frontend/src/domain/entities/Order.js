export class Order {
  constructor({ id, userId, restaurantId, items, total, status, date }) {
    this.id = id
    this.userId = userId
    this.restaurantId = restaurantId
    this.items = items
    this.total = total
    this.status = status
    this.date = date
  }
}
