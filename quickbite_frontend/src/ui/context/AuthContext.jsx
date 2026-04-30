import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { authAPI, tokenStorage, setSessionExpiredHandler } from "../../infrastructure/api/api"
import { LoginUseCase } from "../../application/usecases/LoginUseCase"
import { AuthService } from "../../infrastructure/services/AuthService"

const AuthContext  = createContext()
const authService  = new AuthService()
const loginUseCase = new LoginUseCase(authService)

const API_ENABLED = import.meta.env.VITE_USE_BACKEND === 'true'

// Helper: verificar si el token JWT está expirado sin llamar al backend
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    setUser(null)
    if (API_ENABLED) tokenStorage.remove()
  }, [])

  // Registrar el handler global en api.js para interceptar 401 automáticamente
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null)
    })
  }, [])

  useEffect(() => {
    const restoreSession = async () => {
      if (!API_ENABLED) { setLoading(false); return }

      const token = tokenStorage.get()
      if (!token) { setLoading(false); return }

      // Si el token ya expiró localmente, cerrar sesión sin llamar al backend
      if (isTokenExpired(token)) {
        tokenStorage.remove()
        setLoading(false)
        return
      }

      try {
        const data = await authAPI.me()
        // /me puede responder { user: {} }, { data: {} }, o el objeto directamente
        const user = data.user || data.data || (data.id ? data : null)
        if (user) setUser(user)
      } catch {
        tokenStorage.remove()
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  // Verificar expiración del token cada 60 segundos mientras la app está abierta
  useEffect(() => {
    if (!API_ENABLED) return

    const interval = setInterval(() => {
      const token = tokenStorage.get()
      if (token && isTokenExpired(token)) {
        logout()
      }
    }, 60 * 1000)

    return () => clearInterval(interval)
  }, [logout])

  // Normaliza la respuesta de login/register — los backs usan distintas estructuras
  // Soporta: { token, user }, { token, data: user }, { success, token, user },
  //          { accessToken, user }, { access_token, user }
  const _normalizeAuthResponse = (data) => {
    const token = data.token || data.accessToken || data.access_token || data.jwt
    const user  = data.user || data.data || data.account || null
    return { token, user }
  }

  const login = async (email, password) => {
    if (API_ENABLED) {
      try {
        const raw = await authAPI.login(email, password)
        const { token, user } = _normalizeAuthResponse(raw)
        if (!token) throw new Error('El servidor no devolvió un token de sesión')
        if (!user)  throw new Error('El servidor no devolvió los datos del usuario')
        tokenStorage.save(token)
        setUser(user)
        return { success: true, role: user.role }
      } catch (err) {
        if (err.status === 401) { tokenStorage.remove(); setUser(null) }
        return { success: false, error: err.message || 'Correo o contraseña incorrectos' }
      }
    } else {
      const result = loginUseCase.execute(email, password)
      if (result.success) { setUser(result.user); return { success: true, role: result.user.role } }
      return { success: false, error: result.error }
    }
  }

  const register = async (name, email, password, phone) => {
    if (API_ENABLED) {
      try {
        const raw = await authAPI.register(name, email, password, phone)
        const { token, user } = _normalizeAuthResponse(raw)
        if (token) tokenStorage.save(token)
        if (user)  setUser(user)
        return { success: true }
      } catch (err) {
        return { success: false, error: err.message, errors: err.errors || {} }
      }
    } else {
      const mockUser = { id: Date.now(), name, email, role: 'customer' }
      setUser(mockUser)
      return { success: true }
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
