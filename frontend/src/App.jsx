// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";

import Navbar            from "./components/Navbar";
import Footer            from "./components/Footer";
import TawkToChat        from "./components/TawkToChat";

import HomePage          from "./pages/HomePage";
import ProductsPage      from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage          from "./pages/CartPage";
import CheckoutPage      from "./pages/CheckoutPage";
import PaymentVerifyPage from "./pages/PaymentVerifyPage";
import LoginPage         from "./pages/LoginPage";
import RegisterPage      from "./pages/RegisterPage";
import OrdersPage        from "./pages/OrdersPage";
import OrderDetailPage   from "./pages/OrderDetailPage";
import ProfilePage       from "./pages/ProfilePage";
import AdminDashboard    from "./pages/AdminDashboard";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminOrdersPage   from "./pages/AdminOrdersPage";
import AdminUsersPage    from "./pages/AdminUsersPage";

// Layout wrappers
const PublicLayout  = ({ children }) => <><Navbar />{children}<Footer /></>;
const PrivateLayout = ({ children }) => <ProtectedRoute><Navbar />{children}<Footer /></ProtectedRoute>;
const AdminLayout   = ({ children }) => <AdminRoute><Navbar />{children}<Footer /></AdminRoute>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <TawkToChat />

          <Routes>
            {/* ── Public ─────────────────────────────────────────────────── */}
            <Route path="/" element={
              <PublicLayout><HomePage /></PublicLayout>
            } />
            <Route path="/products" element={
              <PublicLayout><ProductsPage /></PublicLayout>
            } />
            <Route path="/products/:id" element={
              <PublicLayout><ProductDetailPage /></PublicLayout>
            } />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Payment verify — standalone (no nav) */}
            <Route path="/payment/verify" element={<PaymentVerifyPage />} />

            {/* ── Protected (login required) ──────────────────────────── */}
            <Route path="/cart" element={
              <PrivateLayout><CartPage /></PrivateLayout>
            } />
            <Route path="/checkout" element={
              <PrivateLayout><CheckoutPage /></PrivateLayout>
            } />
            <Route path="/orders" element={
              <PrivateLayout><OrdersPage /></PrivateLayout>
            } />
            <Route path="/orders/:id" element={
              <PrivateLayout><OrderDetailPage /></PrivateLayout>
            } />
            <Route path="/profile" element={
              <PrivateLayout><ProfilePage /></PrivateLayout>
            } />

            {/* ── Admin Panel ──────────────────────────────────────────── */}
            <Route path="/admin" element={
              <AdminLayout><AdminDashboard /></AdminLayout>
            } />
            <Route path="/admin/products" element={
              <AdminLayout><AdminProductsPage /></AdminLayout>
            } />
            <Route path="/admin/orders" element={
              <AdminLayout><AdminOrdersPage /></AdminLayout>
            } />
            <Route path="/admin/users" element={
              <AdminLayout><AdminUsersPage /></AdminLayout>
            } />

            {/* ── 404 ─────────────────────────────────────────────────── */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <p className="text-6xl">🔍</p>
                <h1 className="text-3xl font-bold text-gray-700">404 — Page Not Found</h1>
                <a href="/" className="text-primary hover:underline font-medium">← Back to Home</a>
              </div>
            } />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
