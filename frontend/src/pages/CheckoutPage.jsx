// frontend/src/pages/CheckoutPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { load } from "@cashfreepayments/cashfree-js";

const FIELDS = [
  { name:"fullName",     label:"Full Name *",       type:"text" },
  { name:"phone",        label:"Phone Number *",    type:"tel"  },
  { name:"addressLine1", label:"Address Line 1 *",  type:"text" },
  { name:"addressLine2", label:"Address Line 2",    type:"text" },
  { name:"city",         label:"City *",            type:"text" },
  { name:"state",        label:"State *",           type:"text" },
  { name:"pincode",      label:"Pincode *",         type:"text" },
];

export default function CheckoutPage() {
  const { cart }   = useCart();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [loading,       setLoading]       = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cashfree");
  const [address, setAddress] = useState({
    fullName:"", phone: user?.phone || "", addressLine1:"", addressLine2:"", city:"", state:"", pincode:"",
  });

  const items      = cart?.items || [];
  const itemsPrice = cart?.itemsPrice || 0;
  const shipping   = itemsPrice >= 999 ? 0 : 99;
  const tax        = Math.round(itemsPrice * 0.18 * 100) / 100;
  const total      = itemsPrice + shipping + tax;

  const handleChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const { fullName, phone, addressLine1, city, state, pincode } = address;
    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode)
      return toast.error("Please fill all required address fields.");
    if (items.length === 0) return toast.error("Your cart is empty.");

    setLoading(true);
    try {
      const orderItems = items.map((item) => ({
        product:  item.product?._id || item.product,
        quantity: item.quantity,
      }));

      const { data: orderData } = await api.post("/orders", { items: orderItems, shippingAddress: address, paymentMethod });
      const orderId = orderData.order._id;

      if (paymentMethod === "cod") {
        toast.success("Order placed successfully!");
        navigate(`/orders/${orderId}`);
        return;
      }

      const { data: payData } = await api.post("/payments/initiate", { orderId });

      const cashfree = await load({
        mode: process.env.REACT_APP_CASHFREE_ENV === "PROD" ? "production" : "sandbox",
      });

      cashfree.checkout({
        paymentSessionId: payData.paymentSessionId,
        returnUrl: `${window.location.origin}/payment/verify?orderId=${orderId}&cashfreeOrderId=${payData.cashfreeOrderId}`,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>
        <form onSubmit={handlePlaceOrder}>
          <div className="grid md:grid-cols-2 gap-6">

            {/* Left: Address + Payment */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <h2 className="font-bold text-gray-800 mb-4">Shipping Address</h2>
                <div className="space-y-3">
                  {FIELDS.map(({ name, label, type }) => (
                    <div key={name}>
                      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                      <input
                        type={type} name={name} value={address[name]} onChange={handleChange}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <h2 className="font-bold text-gray-800 mb-4">Payment Method</h2>
                <div className="space-y-3">
                  {[
                    { value:"cashfree", label:"💳 Pay Online (Cashfree)", desc:"UPI, Cards, Net Banking, Wallets" },
                    { value:"cod",      label:"💵 Cash on Delivery",      desc:"Pay when your order arrives" },
                  ].map(({ value, label, desc }) => (
                    <label key={value}
                      className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition
                        ${paymentMethod === value ? "border-primary bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input type="radio" name="payment" value={value}
                        checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} className="mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="bg-white rounded-xl p-6 border shadow-sm h-fit">
              <h2 className="font-bold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => {
                  const price = item.discountPrice > 0 ? item.discountPrice : item.price;
                  return (
                    <div key={item.product?._id || item.product} className="flex gap-3 text-sm">
                      <img src={item.image || "/placeholder.png"} alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium line-clamp-2 text-xs">{item.name}</p>
                        <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">₹{(price * item.quantity).toLocaleString("en-IN")}</p>
                    </div>
                  );
                })}
              </div>
              <hr className="my-3" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>₹{itemsPrice.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className={shipping === 0 ? "text-green-600" : ""}>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                </div>
                <div className="flex justify-between"><span className="text-gray-600">GST (18%)</span><span>₹{tax.toLocaleString("en-IN")}</span></div>
                <hr />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-primary">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="mt-6 w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {loading
                  ? <><span className="animate-spin">⟳</span> Processing...</>
                  : paymentMethod === "cashfree"
                    ? `Pay ₹${total.toLocaleString("en-IN")}`
                    : "Place Order"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
