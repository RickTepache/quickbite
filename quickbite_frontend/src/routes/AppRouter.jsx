import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "../ui/pages/Home"
import Restaurant from "../ui/pages/Restaurant"
import Cart from "../ui/pages/Cart"
import Login from "../ui/pages/Login"
import Register from "../ui/pages/Register"
import Checkout from "../ui/pages/Checkout"
import RestaurantDashboard from "../ui/pages/RestaurantDashboard"
import AdminDashboard from "../ui/pages/AdminDashboard"
import ProtectedRoute from "../ui/components/ProtectedRoute"
import MyOrders from "../ui/pages/MyOrders"

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/restaurant/:id" element={<Restaurant />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Solo usuarios logueados */}
        <Route path="/checkout" element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } />

        <Route path="/my-orders" element={
          <ProtectedRoute>
            <MyOrders />
          </ProtectedRoute>
        } />    

        {/* Solo rol "restaurant" */}
        <Route path="/restaurant-panel" element={
          <ProtectedRoute allowedRoles={["restaurant", "admin"]}>
            <RestaurantDashboard />
          </ProtectedRoute>
        } />

        {/* Solo rol "admin" */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
