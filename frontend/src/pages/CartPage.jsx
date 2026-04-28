// frontend/src/pages/CartPage.jsx
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { FiTrash2, FiShoppingBag, FiArrowLeft } from "react-icons/fi";

export default function CartPage() {
  const { cart, cartLoading, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (cartLoading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
    </div>
  );

  const items      = cart?.items || [];
  const itemsPrice = cart?.itemsPrice || 0;
  const shipping   = itemsPrice >= 999 ? 0 : 99;
  const tax        = Math.round(itemsPrice * 0.18 * 100) / 100;
  const total      = itemsPrice + shipping + tax;

  if (items.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <FiShoppingBag size={64} className="text-gray-300 mb-4" />
      <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
      <p className="text-gray-500 mb-6">Add some products to get started</p>
      <Link to="/products" className="bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700">
        Shop Now
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-primary mb-4">
          <FiArrowLeft /> Continue Shopping
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart ({cart?.totalItems} items)</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            {items.map((item) => {
              const price     = item.discountPrice > 0 ? item.discountPrice : item.price;
              const productId = item.product?._id || item.product;
              return (
                <div key={productId} className="bg-white rounded-xl p-4 flex gap-4 shadow-sm border">
                  <img
                    src={item.image || item.product?.images?.[0]?.url || "/placeholder.png"}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 text-sm">{item.name}</h3>
                    <p className="text-primary font-bold mt-1">₹{price.toLocaleString("en-IN")}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center border rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-sm font-bold"
                        >−</button>
                        <span className="px-4 py-1 text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(productId, item.quantity + 1)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-sm font-bold"
                        >+</button>
                      </div>
                      <span className="text-sm text-gray-500">= ₹{(price * item.quantity).toLocaleString("en-IN")}</span>
                      <button onClick={() => removeItem(productId)} className="ml-auto text-red-400 hover:text-red-600">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl p-6 border shadow-sm h-fit">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Items ({cart?.totalItems})</span>
                <span>₹{itemsPrice.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className={shipping === 0 ? "text-green-600" : ""}>
                  {shipping === 0 ? "FREE" : `₹${shipping}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST (18%)</span>
                <span>₹{tax.toLocaleString("en-IN")}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                  Add ₹{(999 - itemsPrice).toFixed(0)} more for free shipping!
                </p>
              )}
              <hr />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <Link to="/checkout" className="mt-6 block w-full bg-primary text-white text-center py-3 rounded-xl font-bold hover:bg-blue-700 transition">
              Proceed to Checkout
            </Link>
            <p className="text-xs text-center text-gray-400 mt-3">🔒 Secure checkout via Cashfree</p>
          </div>
        </div>
      </div>
    </div>
  );
}
