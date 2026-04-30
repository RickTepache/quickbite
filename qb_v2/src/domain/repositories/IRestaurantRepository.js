/**
 * Puerto (interfaz) para el repositorio de restaurantes.
 * Define el contrato que cualquier implementación debe cumplir.
 */
export class IRestaurantRepository {
  getAll() { throw new Error("Not implemented") }
  getById(id) { throw new Error("Not implemented") }
  getByCategory(category) { throw new Error("Not implemented") }
}
