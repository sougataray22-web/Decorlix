// frontend/src/pages/OrdersPage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const STATUS_COLOR = {
  placed:"bg-blue-100 text-blue-700", confirmed:"bg-indigo-100 text-indigo-700",
  processing:"bg-yellow-100 text-yellow-700", shipped:"bg-orange-100 text-orange-700",
  out_for_delivery:"bg-purple-100 text-purple-700", delivered:"bg-green-100 text-green-700",
  cancelled:"bg-red-100 text-red-700", return_requested:"bg-pink-100 text-pink-700",
  returned:"bg-gray-100 text-gray-700", refunded:"bg-teal-100 text-teal-700",
};

export default function OrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/my-orders")
      .then(({ data }) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      {Array(3).fill(0).map((_, i) => <div key={i} className="bg-white rounded-xl h-32 animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-xl font-bold text-gray-700">No orders yet</p>
          <Link to="/products"
            className="mt-4 inline-block bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl border p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-800">#{order.orderNumber}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${STATUS_COLOR[order.orderStatus] || "bg-gray-100"}`}>
                  {order.orderStatus?.replace(/_/g, " ")}
                </span>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto">
                {order.items?.slice(0, 4).map((item, i) => (
                  <img key={i} src={item.image || "/placeholder.png"} alt={item.name}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border" />
                ))}
                {order.items?.length > 4 && (
                  <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium flex-shrink-0">
                    +{order.items.length - 4}
                  </div>
                )}
              </div>

              <div className="mt-3 flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-500">Total: </span>
                  <span className="font-bold text-primary">₹{order.totalPrice?.toLocaleString("en-IN")}</span>
                </div>
                <Link to={`/orders/${order._id}`} className="text-sm text-primary font-medium hover:underline">
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
