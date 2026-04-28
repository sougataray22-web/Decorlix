// frontend/src/components/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../services/api";
import {
  FiShoppingCart, FiUser, FiSearch, FiMenu,
  FiX, FiHeart, FiPackage, FiLogOut,
} from "react-icons/fi";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount }    = useCart();
  const navigate         = useNavigate();

  const [query,       setQuery]       = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [userDrop,    setUserDrop]    = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/products/search-suggestions?q=${query}`);
        setSuggestions(data.suggestions || []);
      } catch (_) {}
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSuggestions([]);
      if (!e.target.closest(".user-menu")) setUserDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(query.trim())}`);
      setSuggestions([]);
      setQuery("");
    }
  };

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">

        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-primary flex-shrink-0">
          🛍️ Decorlix
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 relative" ref={searchRef}>
          <div className="flex">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for decor, furniture, lighting..."
              className="w-full border border-gray-300 rounded-l-lg px-4 py-2
                focus:outline-none focus:border-primary text-sm"
            />
            <button type="submit"
              className="bg-primary text-white px-4 rounded-r-lg hover:bg-blue-700 transition">
              <FiSearch size={18} />
            </button>
          </div>

          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border
              rounded-b-lg shadow-lg z-50 max-h-72 overflow-y-auto">
              {suggestions.map((s) => (
                <div key={s._id}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50
                    cursor-pointer border-b last:border-0"
                  onClick={() => {
                    navigate(`/products/${s.slug || s._id}`);
                    setSuggestions([]);
                    setQuery("");
                  }}>
                  {s.images?.[0]?.url && (
                    <img src={s.images[0].url} alt={s.name}
                      className="w-9 h-9 object-cover rounded" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.name}</p>
                    <p className="text-xs text-primary font-semibold">
                      ₹{(s.discountPrice > 0 ? s.discountPrice : s.price).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Right Icons */}
        <div className="flex items-center gap-4">

          {/* Cart */}
          <Link to="/cart" className="relative">
            <FiShoppingCart size={22} className="text-gray-700 hover:text-primary transition" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white
                text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>

          {/* User Menu */}
          {user ? (
            <div className="relative user-menu">
              <button onClick={() => setUserDrop(!userDrop)}
                className="flex items-center gap-1 text-gray-700 hover:text-primary transition">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-primary" />
                ) : (
                  <FiUser size={22} />
                )}
                <span className="hidden md:block text-sm font-medium">
                  {user.name?.split(" ")[0]}
                </span>
              </button>

              {userDrop && (
                <div className="absolute right-0 mt-2 w-52 bg-white border rounded-xl
                  shadow-lg z-50 py-2">
                  <div className="px-4 py-2 border-b mb-1">
                    <p className="text-sm font-bold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email || `+91${user.phone}`}
                    </p>
                  </div>
                  {[
                    { to:"/profile", icon:<FiUser size={14}/>,    label:"My Profile" },
                    { to:"/orders",  icon:<FiPackage size={14}/>, label:"My Orders"  },
                    { to:"/wishlist",icon:<FiHeart size={14}/>,   label:"Wishlist"   },
                  ].map(({ to, icon, label }) => (
                    <Link key={to} to={to} onClick={() => setUserDrop(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50
                        text-sm text-gray-700">
                      {icon} {label}
                    </Link>
                  ))}
                  {user.role === "admin" && (
                    <Link to="/admin" onClick={() => setUserDrop(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50
                        text-sm text-purple-600 font-semibold">
                      ⚙️ Admin Panel
                    </Link>
                  )}
                  <hr className="my-1" />
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-red-50
                      text-sm text-red-500 w-full">
                    <FiLogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login"
                className="text-primary font-medium text-sm hover:underline hidden md:block">
                Login
              </Link>
              <Link to="/register"
                className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm
                  font-medium hover:bg-blue-700 transition">
                Register
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button className="md:hidden text-gray-700"
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t px-4 py-3 space-y-2">
          <Link to="/"         onClick={() => setMenuOpen(false)} className="block py-2 text-sm">Home</Link>
          <Link to="/products" onClick={() => setMenuOpen(false)} className="block py-2 text-sm">Products</Link>
          <Link to="/cart"     onClick={() => setMenuOpen(false)} className="block py-2 text-sm">Cart ({cartCount})</Link>
          {user && <Link to="/orders" onClick={() => setMenuOpen(false)} className="block py-2 text-sm">My Orders</Link>}
          {!user && <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-primary font-medium">Login / Register</Link>}
        </div>
      )}
    </nav>
  );
}
