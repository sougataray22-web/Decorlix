// frontend/src/pages/AdminUsersPage.jsx
import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { FiTrash2, FiSearch } from "react-icons/fi";

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async (kw = "") => {
    setLoading(true);
    try {
      const params = kw ? `?keyword=${kw}` : "";
      const { data } = await api.get(`/admin/users${params}`);
      setUsers(data.users || []);
    } catch (_) { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(keyword);
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change role to "${newRole}"?`)) return;
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success("Role updated!");
      fetchUsers(keyword);
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success("User deleted.");
      fetchUsers(keyword);
    } catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Users</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search name, email, phone..."
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary w-64" />
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <FiSearch size={16} />
          </button>
        </form>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <div key={i} className="bg-white rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["User","Contact","Role","Joined","Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-semibold text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                        <p className="font-medium">{user.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-600">{user.email || "—"}</p>
                      <p className="text-xs text-gray-400">{user.phone || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select value={user.role} onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className={`text-xs border rounded px-2 py-1 font-medium cursor-pointer
                          ${user.role === "admin" ? "text-purple-700 border-purple-300 bg-purple-50" : "text-gray-600"}`}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(user._id, user.name)}
                        className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50">
                        <FiTrash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-12 text-gray-500">No users found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
