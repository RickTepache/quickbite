/**
 * Caso de uso: obtener el menú de un restaurante.
 */
export class GetMenuByRestaurantUseCase {
  constructor(foodRepository) {
    this.foodRepository = foodRepository
  }

  async execute(restaurantId) {
    return this.foodRepository.getByRestaurantId(restaurantId)
  }
}
