// frontend/src/pages/HomePage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";

const CATEGORY_ICONS = {
  "Wall Decor":"🖼️","Lighting":"💡","Furniture":"🪑","Bed & Bath":"🛏️",
  "Kitchen & Dining":"🍽️","Rugs & Carpets":"🪁","Curtains & Blinds":"🪟",
  "Outdoor & Garden":"🌿","Storage & Organizers":"📦","Festive Decor":"🎉",
};

const BANNERS = [
  { title:"Transform Your Home ✨", sub:"Discover premium home decor at unbeatable prices", btn:"Shop Now", link:"/products", bg:"from-blue-600 to-blue-800" },
  { title:"New Arrivals 🌟",        sub:"Fresh picks for every room in your home",           btn:"Explore",  link:"/products?sort=newest",  bg:"from-purple-600 to-purple-800" },
  { title:"Up to 60% Off 🔥",       sub:"Limited time deals on bestselling decor items",     btn:"Grab Deals",link:"/products?sort=discount", bg:"from-orange-500 to-red-600" },
];

export default function HomePage() {
  const [featured,    setFeatured]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [bannerIdx,   setBannerIdx]   = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featRes, catRes] = await Promise.all([
          api.get("/products/featured"),
          api.get("/products/categories"),
        ]);
        setFeatured(featRes.data.products || []);
        setCategories(catRes.data.categories || []);
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Auto-rotate banner
  useEffect(() => {
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const banner = BANNERS[bannerIdx];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Banner */}
      <section className={`bg-gradient-to-r ${banner.bg} text-white py-20 px-6 transition-all duration-500`}>
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{banner.title}</h1>
          <p className="text-lg md:text-xl text-white/80 mb-8">{banner.sub}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to={banner.link}
              className="bg-white text-blue-700 font-bold px-8 py-3
                rounded-full hover:bg-blue-50 transition text-lg">
              {banner.btn}
            </Link>
            <Link to="/register"
              className="border-2 border-white text-white font-bold px-8 py-3
                rounded-full hover:bg-white/10 transition text-lg">
              Join Free
            </Link>
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {BANNERS.map((_, i) => (
              <button key={i} onClick={() => setBannerIdx(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all
                  ${i === bannerIdx ? "bg-white scale-125" : "bg-white/40"}`} />
            ))}
          </div>
        </div>
      </section>

      {/* Offers ticker */}
      <div className="bg-secondary text-white py-2 overflow-hidden">
        <div className="flex gap-16 animate-marquee whitespace-nowrap px-4">
          {["🚚 Free shipping above ₹999","⚡ Flash sale — up to 60% off",
            "🔒 Secure payments via Cashfree","↩️ Easy 7-day returns",
            "🎁 Gift wrapping available","⭐ 10,000+ happy customers",
            "📞 24/7 customer support",
          ].map((t, i) => <span key={i} className="text-sm font-medium">{t}</span>)}
        </div>
      </div>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Shop by Category</h2>
          <Link to="/products" className="text-primary text-sm font-medium hover:underline">
            View All →
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-24 animate-pulse border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link key={cat._id} to={`/products?category=${cat.slug}`}
                className="bg-white rounded-xl p-4 text-center hover:shadow-md
                  transition border border-gray-100 hover:border-primary group">
                <div className="text-4xl mb-2">{CATEGORY_ICONS[cat.name] || "🏠"}</div>
                <p className="text-sm font-medium text-gray-700 group-hover:text-primary transition">
                  {cat.name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">⭐ Featured Products</h2>
          <Link to="/products?isFeatured=true"
            className="text-primary font-medium text-sm hover:underline">View All →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-72 animate-pulse border" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🛍️</p>
            <p>No featured products yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {featured.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </section>

      {/* Why Decorlix */}
      <section className="bg-white border-t border-b py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon:"🚚", title:"Free Delivery",    desc:"On orders above ₹999"        },
            { icon:"🔒", title:"Secure Payment",   desc:"100% safe & encrypted"        },
            { icon:"↩️", title:"Easy Returns",     desc:"7-day hassle-free return"     },
            { icon:"🎧", title:"24/7 Support",     desc:"Live chat & phone support"    },
          ].map((item) => (
            <div key={item.title} className="group">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform inline-block">
                {item.icon}
              </div>
              <h3 className="font-bold text-gray-800">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Get Exclusive Deals 🎁
        </h2>
        <p className="text-gray-500 mb-6">
          Join 10,000+ subscribers and get the best offers first
        </p>
        <div className="flex gap-2 max-w-md mx-auto">
          <input type="email" placeholder="Enter your email"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3
              focus:outline-none focus:border-primary text-sm" />
          <button className="bg-primary text-white px-6 py-3 rounded-lg font-medium
            hover:bg-blue-700 transition text-sm">
            Subscribe
          </button>
        </div>
      </section>
    </div>
  );
}
