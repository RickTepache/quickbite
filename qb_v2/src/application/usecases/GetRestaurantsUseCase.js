/**
 * Caso de uso: obtener restaurantes, con filtro opcional por categoría.
 */
export class GetRestaurantsUseCase {
  constructor(restaurantRepository) {
    this.restaurantRepository = restaurantRepository
  }

  async execute(category = null) {
    if (category) {
      return this.restaurantRepository.getByCategory(category)
    }
    return this.restaurantRepository.getAll()
  }
}
