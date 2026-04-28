// frontend/src/components/Footer.jsx
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-dark text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">

        <div className="col-span-2 md:col-span-1">
          <h3 className="text-white text-lg font-bold mb-3">🛍️ Decorlix</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Your one-stop destination for premium home decor. Transform your
            living space with our curated collection of beautiful products.
          </p>
          <div className="flex gap-3 mt-4">
            {["📘 Facebook","📸 Instagram","🐦 Twitter"].map((s) => (
              <a key={s} href="#"
                className="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600 transition">
                {s}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {[
              { to:"/",         label:"Home" },
              { to:"/products", label:"All Products" },
              { to:"/cart",     label:"Cart" },
              { to:"/orders",   label:"My Orders" },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="hover:text-white transition">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Customer Service</h4>
          <ul className="space-y-2 text-sm">
            {["Return Policy","Shipping Info","FAQ","Privacy Policy","Terms of Service"]
              .map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-white transition">{item}</a>
                </li>
              ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Contact Us</h4>
          <div className="space-y-2 text-sm text-gray-400">
            <p>📧 support@decorlix.com</p>
            <p>📞 +91 98765 43210</p>
            <p>🕐 Mon–Sat, 9AM – 6PM IST</p>
            <p>📍 Bengaluru, India</p>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Secure Payments by</p>
            <div className="flex gap-2 flex-wrap">
              {["💳 Cards","📱 UPI","🏦 NetBanking"].map((p) => (
                <span key={p} className="text-xs bg-gray-700 px-2 py-1 rounded">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between
          items-center gap-2 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Decorlix. All rights reserved.</p>
          <p>Made with ❤️ in India</p>
        </div>
      </div>
    </footer>
  );
}
