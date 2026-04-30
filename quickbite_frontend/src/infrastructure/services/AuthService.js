import { IAuthRepository } from "../../domain/repositories/IAuthRepository"
import { User } from "../../domain/entities/User"

/**
 * Servicio de autenticación mock (modo sin backend).
 * Estas credenciales coinciden con las que se muestran en la pantalla de Login.
 */
export class AuthService extends IAuthRepository {
  login(email, password) {
    const e = (email || "").trim().toLowerCase()
    const p = password || ""

    if (e === "admin@test.com" && p === "admin123") {
      return { success: true, user: new User({ id: 2, name: "Admin", email: e, role: "admin" }) }
    }
    if (e === "restaurant@test.com" && p === "rest123") {
      return { success: true, user: new User({ id: 3, name: "Restaurant Owner", email: e, role: "restaurant" }) }
    }
    if (e === "user@test.com" && p === "user123") {
      return { success: true, user: new User({ id: 1, name: "Cliente Demo", email: e, role: "customer" }) }
    }
    return { success: false, error: "Correo o contraseña incorrectos" }
  }

  logout() {
    return { success: true }
  }
}
