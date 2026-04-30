/**
 * Caso de uso: autenticación de usuario.
 */
export class LoginUseCase {
  constructor(authService) {
    this.authService = authService
  }

  execute(email, password) {
    if (!email || !password) {
      return { success: false, error: "Email y contraseña son requeridos" }
    }
    return this.authService.login(email, password)
  }
}
