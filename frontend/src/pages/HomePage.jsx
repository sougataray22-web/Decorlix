// frontend/src/pages/HomePage.jsx — CATEGORY FIRST, PRODUCTS SECOND
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";

const CATEGORIES_ICONS = {
  "Wall Decor":"🖼️","Lighting":"💡","Furniture":"🪑",
  "Bed & Bath":"🛏️","Kitchen & Dining":"🍽️","Rugs & Carpets":"🪆",
  "Curtains & Blinds":"🪟","Outdoor & Garden":"🌿",
  "Storage & Organizers":"📦","Festive Decor":"🎉",
};

const SLIDES = [
  { title:"Make Your Home Beautiful",    sub:"Premium decor at prices you'll love",         bg:"from-slate-900 to-blue-900",    badge:"New Arrivals", img:"🛋️" },
  { title:"Up to 60% Off This Week",     sub:"Limited time deals on top-rated items",        bg:"from-rose-900 to-orange-800",   badge:"Flash Sale",   img:"🏮" },
  { title:"Festive Collection Is Here",  sub:"Deck your home for every occasion",            bg:"from-emerald-900 to-teal-800",  badge:"Trending",     img:"🪔" },
];

const OFFERS = [
  "🚚 Free delivery above ₹999","🔒 100% secure payments",
  "↩️ Easy 7-day returns","⭐ 50,000+ happy customers",
  "🎁 Gift wrapping available","📞 24/7 support",
];

export default function HomePage() {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [slide,      setSlide]      = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get("/products?limit=8&sort=newest"),
          api.get("/products/categories"),
        ]);
        setProducts(prodRes.data.products || []);
        setCategories(catRes.data.categories || []);
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, []);

  const cur = SLIDES[slide];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className={`bg-gradient-to-r ${cur.bg} transition-all duration-700`}>
        <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-white">
            <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
              {cur.badge}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">{cur.title}</h1>
            <p className="text-lg text-white/75 mb-8">{cur.sub}</p>
            <div className="flex gap-3 flex-wrap">
              <Link to="/products"
                className="bg-white text-gray-900 font-bold px-7 py-3 rounded-full hover:bg-gray-100 transition text-sm">
                Shop Now
              </Link>
              <Link to="/products?sort=discount"
                className="border-2 border-white/60 text-white font-semibold px-7 py-3 rounded-full hover:bg-white/10 transition text-sm">
                View Offers
              </Link>
            </div>
            <div className="flex gap-2 mt-8">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === slide ? "bg-white w-8" : "bg-white/40 w-2"}`} />
              ))}
            </div>
          </div>
          <div className="text-[120px] md:text-[160px] select-none drop-shadow-2xl"
            style={{ animation: "bounce 3s infinite" }}>
            {cur.img}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="bg-primary text-white py-2.5 overflow-hidden">
        <div className="flex gap-12 whitespace-nowrap animate-marquee">
          {[...OFFERS,...OFFERS].map((t, i) => (
            <span key={i} className="text-sm font-medium flex-shrink-0">{t} &nbsp; •</span>
          ))}
        </div>
      </div>

      {/* Trust badges */}
      <section className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {icon:"🚚",title:"Free Delivery",  desc:"Orders above ₹999"},
            {icon:"🔒",title:"Secure Payment", desc:"100% safe checkout"},
            {icon:"↩️",title:"Easy Returns",   desc:"7-day hassle-free"},
            {icon:"🎧",title:"24/7 Support",   desc:"Always here for you"},
          ].map((b) => (
            <div key={b.title} className="flex items-center gap-3">
              <span className="text-2xl">{b.icon}</span>
              <div>
                <p className="text-sm font-bold text-gray-800">{b.title}</p>
                <p className="text-xs text-gray-500">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ★ CATEGORIES FIRST ★ */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">Shop by Category</h2>
          <Link to="/products" className="text-primary text-sm hover:underline">See all →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {Array(10).fill(0).map((_, i) => <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {categories.map((cat) => (
              <Link key={cat._id} to={`/products?category=${cat.slug}`}
                className="bg-white rounded-xl p-4 text-center hover:shadow-md transition border border-gray-100 hover:border-primary group">
                <div className="text-3xl mb-2">{CATEGORIES_ICONS[cat.name] || "🏠"}</div>
                <p className="text-xs font-semibold text-gray-700 group-hover:text-primary leading-tight">{cat.name}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ★ FEATURED PRODUCTS SECOND ★ */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">🔥 Latest Products</h2>
          <Link to="/products" className="text-primary text-sm hover:underline">View all →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => <div key={i} className="bg-white rounded-xl h-72 animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border">
            <p className="text-5xl mb-3">🛍️</p>
            <p className="text-gray-500 font-medium">No products yet</p>
            <p className="text-sm text-gray-400 mt-1">Admin panel থেকে product add করুন</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </section>

      {/* Promo Banners */}
      <section className="max-w-7xl mx-auto px-4 pb-12 grid md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-7 text-white flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Special Offer</p>
            <h3 className="text-2xl font-bold mb-1">Flat ₹200 Off</h3>
            <p className="text-sm opacity-80 mb-4">On your first order above ₹999</p>
            <Link to="/products" className="bg-white text-orange-600 font-bold px-5 py-2 rounded-full text-sm hover:bg-orange-50">
              Shop Now
            </Link>
          </div>
          <span className="text-6xl">🎁</span>
        </div>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-7 text-white flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">New Collection</p>
            <h3 className="text-2xl font-bold mb-1">Festive Decor</h3>
            <p className="text-sm opacity-80 mb-4">Light up your home this season</p>
            <Link to="/products?category=festive-decor"
              className="bg-white text-purple-600 font-bold px-5 py-2 rounded-full text-sm hover:bg-purple-50">
              Explore
            </Link>
          </div>
          <span className="text-6xl">🪔</span>
        </div>
      </section>

    </div>
  );
}