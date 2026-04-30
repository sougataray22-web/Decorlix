// frontend/src/pages/LoginPage.jsx
import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../config/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import api from "../services/api";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [mode,    setMode]    = useState("email");
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({ email:"", password:"", phone:"", otp:"", name:"" });
  const confirmRef = useRef(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ── Email login ──────────────────────────────────────────────────────────
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email: form.email, password: form.password });
      login(data.user, data.token);
      localStorage.setItem("userInfo", JSON.stringify({
      ...data.user,
      token: data.token
     }))
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally { setLoading(false); }
  };

  // ── Phone OTP ────────────────────────────────────────────────────────────
const setupRecaptcha = () => {
  if (window.recaptchaVerifier) return;
  try {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: (response) => {
        console.log("reCAPTCHA resolved:", response);
      },
    });
  } catch (error) {
    console.error("RecaptchaVerifier error:", error);
  }
};

  async function sendOTP(e) {
    e.preventDefault();
    if (!form.phone || form.phone.length < 10) return toast.error("Enter a valid 10-digit phone number");
    setLoading(true);
    try {
      setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, `+91${form.phone}`, window.recaptchaVerifier);
      confirmRef.current = result;
      setStep(2);
      toast.success("OTP sent to your phone!");
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
      if (window.recaptchaVerifier) { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; }
    } finally { setLoading(false); }
  }

  const verifyOTP = async (e) => {
    e.preventDefault();
    if (form.otp.length !== 6) return toast.error("Enter 6-digit OTP");
    setLoading(true);
    try {
      const result  = await confirmRef.current.confirm(form.otp);
      const idToken = await result.user.getIdToken();
      const { data } = await api.post("/auth/firebase-login", { idToken, name: form.name || undefined });
      login(data.user, data.token);
      localStorage.setItem("userInfo", JSON.stringify({
      ...data.user,
      token: data.token
     }))
      toast.success("Login successful!");
      navigate("/");
    } catch (err) {
      toast.error("Invalid OTP. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Welcome to Decorlix 🛍️</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Login to continue shopping</p>

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {["email","phone"].map((m) => (
            <button key={m} onClick={() => { setMode(m); setStep(1); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition
                ${mode === m ? "bg-white text-primary shadow" : "text-gray-500 hover:text-gray-700"}`}>
              {m === "email" ? "📧 Email" : "📱 Phone OTP"}
            </button>
          ))}
        </div>

        {/* Email Form */}
        {mode === "email" && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="you@example.com"
                className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                placeholder="Min. 6 characters"
                className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-60">
              {loading ? "Logging in..." : "Login"}
            </button>
            <p className="text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">Register</Link>
            </p>
          </form>
        )}

        {/* Phone Step 1 */}
        {mode === "phone" && step === 1 && (
          <form onSubmit={sendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Mobile Number</label>
              <div className="flex gap-2">
                <span className="border rounded-lg px-3 py-3 text-sm bg-gray-50 text-gray-600 flex-shrink-0">🇮🇳 +91</span>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                  placeholder="10-digit mobile number" maxLength={10}
                  className="flex-1 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary" required />
              </div>
            </div>
            <div id="recaptcha-container" />
            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-60">
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Phone Step 2 */}
        {mode === "phone" && step === 2 && (
          <form onSubmit={verifyOTP} className="space-y-4">
            <p className="text-sm text-center text-gray-600">OTP sent to +91-{form.phone}</p>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Enter OTP</label>
              <input type="text" name="otp" value={form.otp} onChange={handleChange}
                placeholder="6-digit OTP" maxLength={6}
                className="w-full border rounded-lg px-4 py-3 text-sm text-center text-2xl tracking-widest focus:outline-none focus:border-primary" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Your Name (optional)</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                placeholder="Enter your name"
                className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-60">
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-gray-500 text-sm hover:underline">
              ← Change Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
