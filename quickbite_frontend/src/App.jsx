import { CartProvider } from "./ui/context/CartContext"
import { AuthProvider } from "./ui/context/AuthContext"
import AppRouter from "./routes/AppRouter"

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRouter />
      </CartProvider>
    </AuthProvider>
  )
}

export default App
