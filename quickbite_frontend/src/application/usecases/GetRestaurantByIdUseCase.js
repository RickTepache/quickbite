/**
 * Caso de uso: obtener un restaurante por ID.
 */
export class GetRestaurantByIdUseCase {
  constructor(restaurantRepository) {
    this.restaurantRepository = restaurantRepository
  }

  async execute(id) {
    return this.restaurantRepository.getById(id)
  }
}
