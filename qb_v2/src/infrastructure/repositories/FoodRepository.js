import { IFoodRepository } from "../../domain/repositories/IFoodRepository"
import { Food } from "../../domain/entities/Food"
import { foods as mockFoods } from "../../data/mockData"
import { menuAPI } from "../api/api"

const API_ENABLED = import.meta.env.VITE_USE_BACKEND === 'true'

// Normaliza la respuesta del backend (snake_case) al formato que espera Food (camelCase)
const normalize = (f) => ({
  id:           f.id,
  restaurantId: f.restaurant_id || f.restaurantId,
  name:         f.name,
  price:        f.price,
  popular:      f.popular,
  image:        f.image,
})

export class FoodRepository extends IFoodRepository {
  async getAll() {
    return mockFoods.map(f => new Food(f))
  }

  async getByRestaurantId(restaurantId) {
    if (API_ENABLED) {
      try {
        const data = await menuAPI.getByRestaurant(restaurantId)
        return (data.data || []).map(f => new Food(normalize(f)))
      } catch (err) {
        console.warn('Error fetching menu from API, using mock:', err.message)
      }
    }
    return mockFoods
      .filter(f => f.restaurantId === parseInt(restaurantId))
      .map(f => new Food(f))
  }
}
