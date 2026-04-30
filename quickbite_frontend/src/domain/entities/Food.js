export class Food {
  constructor({ id, restaurantId, name, price, popular, image }) {
    this.id = id
    this.restaurantId = restaurantId
    this.name = name
    this.price = price
    this.popular = popular
    this.image = image
  }
}
