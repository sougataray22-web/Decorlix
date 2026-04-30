// frontend/src/pages/CheckoutPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../services/api";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("online");

  useEffect(() => {
    if (!user) {
      toast.error("Please login first");
      navigate("/login");
    }
    if (!cart?.items || cart.items.length === 0) {
      toast.error("Your cart is empty");
      navigate("/cart");
    }
  }, [user, cart, navigate]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress({ ...shippingAddress, [name]: value });
  };

  const calculateTotals = () => {
    const itemsPrice = cart?.itemsPrice || 0;
    const shipping = itemsPrice >= 499 ? 0 : 49;
    const tax = 0;
    const total = itemsPrice + shipping + tax;
    return { itemsPrice, shipping, tax, total };
  };

  const { itemsPrice, shipping, tax, total } = calculateTotals();

  const handleCODOrder = async (e) => {
    e.preventDefault();
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine1) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/orders", {
        items: cart.items,
        shippingAddress,
        paymentMethod: "cod",
        itemsPrice,
        shippingPrice: shipping,
        taxPrice: tax,
        totalPrice: total,
      });

      toast.success("Order placed successfully!");
      navigate(`/orders/${data.order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Order failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine1) {
      toast.error("Please fill all required fields");
      return;
    }

    setPaymentLoading(true);
    try {
      const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const amount = parseFloat(total).toFixed(2);

      if (parseFloat(amount) < 1) {
        toast.error("Invalid amount");
        setPaymentLoading(false);
        return;
      }

      const { data } = await api.post("/payments/initiate", {
        orderId,
        amount,
        customerEmail: user?.email || "user@decorlix.com",
        customerPhone: shippingAddress.phone,
        returnUrl: `${window.location.origin}/payment/verify`,
      });

      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast.error(data.message || "Payment initialization failed");
      }
    } catch (error) {
      console.error("Payment Error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Payment initiation failed");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (!cart || !cart.items || cart.items.length === 0) {
    return <div className="text-center py-20">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-8">

        {/* Shipping & Payment */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow">
          <h2 className="text-2xl font-bold mb-6">Checkout</h2>

          {/* Shipping Address */}
          <form onSubmit={handleCODOrder}>
            <h3 className="text-lg font-bold mb-4">Shipping Address</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <input type="text" name="fullName" value={shippingAddress.fullName} onChange={handleAddressChange}
                placeholder="Full Name *" className="col-span-2 border rounded-lg px-4 py-2 focus:outline-none focus:border-primary" required />
              <input type="tel" name="phone" value={shippingAddress.phone} onChange={handleAddressChange}
                placeholder="Phone *" className="col-span-2 border rounded-lg px-4 py-2 focus:outline-none focus:border-primary" required />
              <input type="text" name="addressLine1" value={shippingAddress.addressLine1} onChange={handleAddressChange}
                placeholder="Address Line 1 *" className="col-span-2 border rounded-lg px-4 py-2 focus:outline-none focus:border-primary" required />
              <input type="text" name="addressLine2" value={shippingAddress.addressLine2} onChange={handleAddressChange}
                placeholder="Address Line 2" className="col-span-2 border rounded-lg px-4 py-2 focus:outline-none focus:border-primary" />
              <input type="text" name="city" value={shippingAddress.city} onChange={handleAddressChange}
                placeholder="City *" className="border rounded-lg px-4 py-2 focus:outline-none focus:border-primary" required />
              <input type="text" name="state" value={shippingAddress.state} onChange={handleAddressChange}
                placeholder="State *" className="border rounded-lg px-4 py-2 focus:outline-none focus:border-primary" required />
              <input type="text" name="pincode" value={shippingAddress.pincode} onChange={handleAddressChange}
                placeholder="Pincode *" className="col-span-2 border rounded-lg px-4 py-2 focus:outline-none focus:border-primary" required />
            </div>

            {/* Payment Method */}
            <h3 className="text-lg font-bold mb-4">Payment Method</h3>
            <div className="space-y-3 mb-6">
              <label className="flex items-center border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                <input type="radio" name="payment" value="online" checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} className="w-4 h-4" />
                <span className="ml-3 font-medium">Pay Online (Cashfree)</span>
              </label>
              <label className="flex items-center border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="w-4 h-4" />
                <span className="ml-3 font-medium">Cash on Delivery</span>
              </label>
            </div>

            {paymentMethod === "online" ? (
              <button type="button" onClick={handlePayment} disabled={paymentLoading}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-60">
                {paymentLoading ? "Processing..." : `Pay ₹${total.toFixed(2)}`}
              </button>
            ) : (
              <button type="submit" disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-60">
                {loading ? "Placing Order..." : "Place Order"}
              </button>
            )}
          </form>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-6 shadow h-fit">
          <h3 className="text-lg font-bold mb-4">Order Summary</h3>
          <div className="space-y-3 border-b pb-4 mb-4">
            {cart.items.map((item) => (
              <div key={item.product._id} className="flex justify-between text-sm">
                <span>{item.product.name} x{item.quantity}</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{itemsPrice.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>₹{shipping.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax (18%)</span><span>₹{tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span className="text-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}