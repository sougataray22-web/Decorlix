// frontend/src/pages/AdminOrdersPage.jsx
import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const STATUS_OPTIONS = ["placed","confirmed","processing","shipped","out_for_delivery","delivered","cancelled","return_requested","returned","refunded"];

const STATUS_COLOR = {
  placed:"bg-blue-100 text-blue-700", confirmed:"bg-indigo-100 text-indigo-700",
  processing:"bg-yellow-100 text-yellow-700", shipped:"bg-orange-100 text-orange-700",
  out_for_delivery:"bg-purple-100 text-purple-700", delivered:"bg-green-100 text-green-700",
  cancelled:"bg-red-100 text-red-700", return_requested:"bg-pink-100 text-pink-700",
  returned:"bg-gray-100 text-gray-700", refunded:"bg-teal-100 text-teal-700",
};

export default function AdminOrdersPage() {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [newStatus,   setNewStatus]   = useState("");
  const [tracking,    setTracking]    = useState("");
  const [carrier,     setCarrier]     = useState("");
  const [updating,    setUpdating]    = useState(false);
  const [filterStatus,setFilterStatus]= useState("");

  useEffect(() => { fetchOrders(); }, [filterStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : "";
      const { data } = await api.get(`/orders/admin/all${params}`);
      setOrders(data.orders || []);
    } catch (_) { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return toast.error("Select a status");
    setUpdating(true);
    try {
      await api.put(`/orders/admin/${selected._id}/status`, {
        orderStatus: newStatus,
        trackingNumber: tracking,
        shippingCarrier: carrier,
      });
      toast.success("Order status updated!");
      setSelected(null); setNewStatus(""); setTracking(""); setCarrier("");
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally { setUpdating(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Orders</h1>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </select>
      </div>

      {/* Update Status Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-lg mb-4">Update Order #{selected.orderNumber}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">New Status *</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm">
                  <option value="">Select status</option>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                </select>
              </div>
              {newStatus === "shipped" && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tracking Number</label>
                    <input value={tracking} onChange={(e) => setTracking(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Carrier</label>
                    <input value={carrier} onChange={(e) => setCarrier(e.target.value)}
                      placeholder="e.g. DTDC, BlueDart" className="w-full border rounded-lg px-3 py-2 mt-1 text-sm" />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleUpdateStatus} disabled={updating}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60">
                {updating ? "Updating..." : "Update"}
              </button>
              <button onClick={() => setSelected(null)}
                className="flex-1 border py-2.5 rounded-xl text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Order #","Customer","Items","Total","Payment","Status","Action"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-semibold text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-bold text-primary text-xs">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-xs">{order.user?.name}</p>
                      <p className="text-xs text-gray-400">{order.user?.phone || order.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{order.items?.length} item(s)</td>
                    <td className="px-4 py-3 font-bold">₹{order.totalPrice?.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium capitalize ${order.paymentStatus === "paid" ? "text-green-600" : "text-orange-500"}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_COLOR[order.orderStatus] || "bg-gray-100"}`}>
                        {order.orderStatus?.replace(/_/g," ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelected(order); setNewStatus(order.orderStatus); }}
                        className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="text-center py-12 text-gray-500">No orders found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
