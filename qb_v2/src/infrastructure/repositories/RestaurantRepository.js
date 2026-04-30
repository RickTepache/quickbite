import { IRestaurantRepository } from "../../domain/repositories/IRestaurantRepository"
import { Restaurant } from "../../domain/entities/Restaurant"
import { restaurants as mockRestaurants } from "../../data/mockData"
import { restaurantsAPI } from "../api/api"

const API_ENABLED = import.meta.env.VITE_USE_BACKEND === 'true'

export class RestaurantRepository extends IRestaurantRepository {
  async getAll(category) {
    if (API_ENABLED) {
      try {
        const data = await restaurantsAPI.getAll(category)
        return (data.data || []).map(r => new Restaurant(r))
      } catch (err) {
        console.warn('Error fetching restaurants from API, using mock:', err.message)
        // Solo cae al mock si el backend falla
        return this._mockGetAll(category)
      }
    }
    return this._mockGetAll(category)
  }

  async getById(id) {
    if (API_ENABLED) {
      try {
        const data = await restaurantsAPI.getById(id)
        return data.data ? new Restaurant(data.data) : null
      } catch (err) {
        console.warn('Error fetching restaurant from API, using mock:', err.message)
        return this._mockGetById(id)
      }
    }
    return this._mockGetById(id)
  }

  async getByCategory(category) {
    // Ahora también usa el backend cuando está habilitado
    return this.getAll(category)
  }

  // ── Helpers mock (solo se usan si el backend falla o está deshabilitado) ──
  _mockGetAll(category) {
    const list = category
      ? mockRestaurants.filter(r => r.category === category)
      : mockRestaurants
    return list.map(r => new Restaurant(r))
  }

  _mockGetById(id) {
    const found = mockRestaurants.find(r => r.id === parseInt(id))
    return found ? new Restaurant(found) : null
  }
}
