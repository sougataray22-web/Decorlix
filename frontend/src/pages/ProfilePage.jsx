// frontend/src/pages/ProfilePage.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name,    setName]    = useState(user?.name || "");
  const [saving,  setSaving]  = useState(false);
  const [pwForm,  setPwForm]  = useState({ currentPassword:"", newPassword:"", confirm:"" });
  const [pwSaving,setPwSaving]= useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name cannot be empty");
    setSaving(true);
    try {
      await api.put("/auth/profile", { name });
      await refreshUser();
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error("Passwords do not match");
    if (pwForm.newPassword.length < 6) return toast.error("Min. 6 characters");
    setPwSaving(true);
    try {
      await api.put("/auth/change-password", { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success("Password changed!");
      setPwForm({ currentPassword:"", newPassword:"", confirm:"" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally { setPwSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>

      {/* Profile Info */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-800 text-lg">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email || user?.phone}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
              ${user?.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
              {user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input value={user?.email || "—"} disabled className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
            <input value={user?.phone ? `+91 ${user.phone}` : "—"} disabled
              className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
          </div>
          <button type="submit" disabled={saving}
            className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Change Password (only for email users) */}
      {user?.email && (
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-3">
            {[
              { name:"currentPassword", label:"Current Password" },
              { name:"newPassword",     label:"New Password" },
              { name:"confirm",         label:"Confirm New Password" },
            ].map(({ name, label }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                <input type="password" value={pwForm[name]}
                  onChange={(e) => setPwForm({ ...pwForm, [name]: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
            ))}
            <button type="submit" disabled={pwSaving}
              className="bg-gray-800 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 disabled:opacity-60">
              {pwSaving ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
