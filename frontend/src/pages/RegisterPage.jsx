// frontend/src/pages/RegisterPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

const FIELDS = [
  { name:"name",    label:"Full Name",        type:"text",     placeholder:"Your Name" },
  { name:"email",   label:"Email Address",    type:"email",    placeholder:"you@example.com" },
  { name:"password",label:"Password",         type:"password", placeholder:"Min. 6 characters" },
  { name:"confirm", label:"Confirm Password", type:"password", placeholder:"Repeat password" },
];

export default function RegisterPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name:"", email:"", password:"", confirm:"" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error("Passwords do not match.");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { name: form.name, email: form.email, password: form.password });
      login(data.user, data.token);
      toast.success("Account created! Welcome to Decorlix 🎉");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account 🎉</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {FIELDS.map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
              <input type={type} name={name} value={form[name]} onChange={handleChange}
                placeholder={placeholder}
                className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary" required />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-60">
            {loading ? "Creating Account..." : "Create Account"}
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
