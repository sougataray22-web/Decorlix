// frontend/src/pages/OrderDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const SHOW_GST = false;
const STEPS = ["placed","confirmed","processing","shipped","out_for_delivery","delivered"];

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order,      setOrder]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data.order)).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    setCancelling(true);
    try {
      const { data } = await api.put(`/orders/${id}/cancel`, { reason:"Customer requested cancellation" });
      setOrder(data.order);
      toast.success("Order cancelled.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancel failed");
    } finally { setCancelling(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
    </div>
  );

  if (!order) return (
    <div className="text-center py-20">
      <p>Order not found. <Link to="/orders" className="text-primary">Back to Orders</Link></p>
    </div>
  );

  const currentStep = STEPS.indexOf(order.orderStatus);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">#{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
          </p>
        </div>
        <Link to="/orders" className="text-primary text-sm hover:underline">← All Orders</Link>
      </div>

      {/* Progress Tracker */}
      {!["cancelled","return_requested","returned","refunded"].includes(order.orderStatus) && (
        <div className="bg-white rounded-xl p-5 border">
          <h2 className="font-semibold text-gray-800 mb-4">Order Tracking</h2>
          <div className="flex justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
            <div className="absolute top-4 left-0 h-0.5 bg-primary z-0 transition-all"
              style={{ width: currentStep >= 0 ? `${(currentStep / (STEPS.length - 1)) * 100}%` : "0%" }} />
            {STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2
                  ${i <= currentStep ? "bg-primary border-primary text-white" : "bg-white border-gray-300 text-gray-400"}`}>
                  {i <= currentStep ? "✓" : i + 1}
                </div>
                <p className={`text-xs mt-1 text-center max-w-[56px] capitalize
                  ${i <= currentStep ? "text-primary font-medium" : "text-gray-400"}`}>
                  {step.replace(/_/g," ")}
                </p>
              </div>
            ))}
          </div>
          {order.trackingNumber && (
            <p className="text-sm text-gray-600 mt-4">
              Tracking: <strong>{order.trackingNumber}</strong>
              {order.shippingCarrier && ` via ${order.shippingCarrier}`}
            </p>
          )}
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Items Ordered</h2>
        <div className="space-y-4">
          {order.items?.map((item) => {
            const price = item.discountPrice > 0 ? item.discountPrice : item.price;
            return (
              <div key={item._id} className="flex gap-4">
                <img src={item.image || "/placeholder.png"} alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg border" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold text-gray-800 text-sm">
                  ₹{(price * item.quantity).toLocaleString("en-IN")}
                </p>
              </div>
            );
          })}
        </div>
        <hr className="my-4" />
        <div className="Space-y-1 text-sm">
        <div className="flex justify-between text-gray-600"><span>Items</span><span>₹{order.itemsPrice?.toLocaleString("en-IN")}</span></div>
        <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{order.shippingPrice === 0 ? "FREE" : `₹${order.shippingPrice}`}</span></div>
        <div className="flex justify-between text-gray-600"><span>GST</span><span>₹{order.taxPrice?.toLocaleString("en-IN")}</span></div>
        <div className="flex justify-between font-bold text-base mt-2">
         <span>Total</span>
         <span className="text-primary">₹{order.totalPrice?.toLocaleString("en-IN")}</span>
        </div>
       </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Shipping Address</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          {order.shippingAddress?.fullName}<br />
          {order.shippingAddress?.addressLine1}<br />
          {order.shippingAddress?.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
          {order.shippingAddress?.city}, {order.shippingAddress?.state} – {order.shippingAddress?.pincode}<br />
          📞 {order.shippingAddress?.phone}
        </p>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Payment</h2>
        <p className="text-sm text-gray-600">Method: <strong className="capitalize">{order.paymentMethod}</strong></p>
        <p className="text-sm mt-1">
          Status:{" "}
          <span className={`font-medium capitalize ${order.paymentStatus === "paid" ? "text-green-600" : "text-orange-500"}`}>
            {order.paymentStatus}
          </span>
        </p>
      </div>

      {/* Cancel */}
      {["placed","confirmed","processing"].includes(order.orderStatus) && (
        <button onClick={handleCancel} disabled={cancelling}
          className="w-full border-2 border-red-400 text-red-500 py-3 rounded-xl font-semibold hover:bg-red-50 transition disabled:opacity-50">
          {cancelling ? "Cancelling..." : "Cancel Order"}
        </button>
      )}
    </div>
  );
}
