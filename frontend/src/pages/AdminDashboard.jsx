// frontend/src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/dashboard").then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array(8).fill(0).map((_, i) => <div key={i} className="bg-gray-200 h-24 rounded-xl animate-pulse" />)}
    </div>
  );

  const s = stats?.stats;

  const cards = [
    { label:"Total Revenue",   value:`₹${s?.revenue?.total?.toLocaleString("en-IN")}`,      icon:"💰", color:"bg-green-50 border-green-200"  },
    { label:"This Month",      value:`₹${s?.revenue?.thisMonth?.toLocaleString("en-IN")}`,   icon:"📈", color:"bg-blue-50 border-blue-200"    },
    { label:"Total Orders",    value:s?.orders?.total,     icon:"📦", color:"bg-orange-50 border-orange-200" },
    { label:"Orders Today",    value:s?.orders?.today,     icon:"🛍️", color:"bg-purple-50 border-purple-200" },
    { label:"Total Users",     value:s?.users?.total,      icon:"👥", color:"bg-teal-50 border-teal-200"    },
    { label:"New Today",       value:s?.users?.newToday,   icon:"🆕", color:"bg-pink-50 border-pink-200"    },
    { label:"Active Products", value:s?.products?.active,  icon:"🏷️", color:"bg-yellow-50 border-yellow-200"},
    { label:"Low Stock",       value:s?.products?.lowStock, icon:"⚠️", color:"bg-red-50 border-red-200"    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {cards.map(({ label, value, icon, color }) => (
            <div key={label} className={`bg-white rounded-xl p-5 border ${color} shadow-sm`}>
              <div className="text-3xl mb-2">{icon}</div>
              <div className="text-2xl font-bold text-gray-800">{value}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { to:"/admin/products",  label:"Manage Products", icon:"🏷️" },
            { to:"/admin/orders",    label:"Manage Orders",   icon:"📦" },
            { to:"/admin/users",     label:"Manage Users",    icon:"👥" },
            { to:"/admin/inventory", label:"Inventory",       icon:"📊" },
          ].map(({ to, label, icon }) => (
            <Link key={to} to={to}
              className="bg-white rounded-xl p-4 border hover:shadow-md transition flex items-center gap-3 hover:border-primary">
              <span className="text-2xl">{icon}</span>
              <span className="font-medium text-gray-700">{label}</span>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-bold text-gray-800 mb-4">Recent Orders</h2>
            <div className="space-y-3">
              {stats?.recentOrders?.length === 0 && <p className="text-sm text-gray-500">No orders yet.</p>}
              {stats?.recentOrders?.map((order) => (
                <div key={order._id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.user?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">₹{order.totalPrice?.toLocaleString("en-IN")}</p>
                    <p className="text-xs capitalize text-gray-500">{order.orderStatus}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-bold text-gray-800 mb-4">⚠️ Low Stock Alerts</h2>
            <div className="space-y-3">
              {stats?.lowStockAlerts?.length === 0
                ? <p className="text-sm text-green-600">All products are well stocked ✓</p>
                : stats?.lowStockAlerts?.map((p) => (
                    <div key={p._id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                      <div className="flex items-center gap-2">
                        <img src={p.images?.[0]?.url || "/placeholder.png"} alt={p.name}
                          className="w-10 h-10 rounded object-cover" />
                        <div>
                          <p className="font-medium text-xs line-clamp-1">{p.name}</p>
                          {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                        ${p.stock === 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
                        {p.stock === 0 ? "Out" : `${p.stock} left`}
                      </span>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
