// frontend/src/pages/ProductDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FiStar, FiShoppingCart, FiTruck, FiShield, FiRefreshCw } from "react-icons/fi";
import ProductCard from "../components/ProductCard";

export default function ProductDetailPage() {
  const { id }        = useParams();
  const { addToCart } = useCart();
  const { user }      = useAuth();

  const [product,    setProduct]    = useState(null);
  const [related,    setRelated]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [mainImage,  setMainImage]  = useState(0);
  const [quantity,   setQuantity]   = useState(1);
  const [activeTab,  setActiveTab]  = useState("description");
  const [review,     setReview]     = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMainImage(0);
    setQuantity(1);
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.product);
      setRelated(data.related || []);
    } catch (_) { setProduct(null); }
    finally { setLoading(false); }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please login to write a review");
    if (!review.comment.trim()) return toast.error("Please write a comment");
    setSubmitting(true);
    try {
      await api.post(`/products/${product._id}/reviews`, review);
      toast.success("Review submitted!");
      fetchProduct();
      setReview({ rating: 5, comment: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8 animate-pulse">
        <div className="bg-gray-200 h-96 rounded-xl" />
        <div className="space-y-4">
          <div className="bg-gray-200 h-8 rounded w-3/4" />
          <div className="bg-gray-200 h-6 rounded w-1/3" />
          <div className="bg-gray-200 h-16 rounded" />
          <div className="bg-gray-200 h-12 rounded" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-24">
      <p className="text-6xl mb-4">😕</p>
      <h2 className="text-xl font-bold text-gray-700 mb-2">Product not found</h2>
      <Link to="/products" className="text-primary hover:underline">← Back to Products</Link>
    </div>
  );

  const effectivePrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const savings        = product.discountPrice > 0 ? product.price - product.discountPrice : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1 flex-wrap">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>›</span>
          <Link to="/products" className="hover:text-primary">Products</Link>
          {product.category && (
            <><span>›</span>
            <Link to={`/products?category=${product.category.slug}`}
              className="hover:text-primary">{product.category.name}</Link></>
          )}
          <span>›</span>
          <span className="text-gray-800 line-clamp-1">{product.name}</span>
        </nav>

        {/* Main product section */}
        <div className="bg-white rounded-xl p-6 shadow-sm grid md:grid-cols-2 gap-8">

          {/* Images */}
          <div>
            <div className="bg-gray-50 rounded-xl overflow-hidden h-80 mb-3 border">
              <img
                src={product.images?.[mainImage]?.url || "https://via.placeholder.com/600x600?text=No+Image"}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setMainImage(i)}
                    className={`w-16 h-16 border-2 rounded-lg overflow-hidden flex-shrink-0
                      transition ${mainImage === i ? "border-primary" : "border-gray-200 hover:border-gray-400"}`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            {product.brand && (
              <p className="text-sm text-gray-500 font-medium mb-1">{product.brand}</p>
            )}
            <h1 className="text-2xl font-bold text-gray-900 leading-snug">
              {product.name}
            </h1>

            {/* Rating */}
            {product.numReviews > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 bg-green-500 text-white
                  px-2 py-0.5 rounded text-sm font-medium">
                  {product.rating} <FiStar size={12} />
                </div>
                <span className="text-sm text-gray-500">
                  {product.numReviews} rating{product.numReviews !== 1 ? "s" : ""}
                </span>
                <button onClick={() => setActiveTab("reviews")}
                  className="text-sm text-primary hover:underline">
                  See all reviews
                </button>
              </div>
            )}

            {/* Price Block */}
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold text-gray-900">
                  ₹{effectivePrice.toLocaleString("en-IN")}
                </span>
                {product.discountPrice > 0 && (
                  <>
                    <span className="text-gray-400 line-through text-lg">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-green-600 font-bold text-sm bg-green-50
                      px-2 py-0.5 rounded">
                      {product.discountPercent}% off
                    </span>
                  </>
                )}
              </div>
              {savings > 0 && (
                <p className="text-green-600 text-sm mt-1">
                  You save ₹{savings.toLocaleString("en-IN")}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Quantity & Cart */}
            <div className="mt-5">
              {product.stock > 0 ? (
                <>
                  <p className="text-sm text-green-600 font-medium mb-3">
                    ✓ In Stock — {product.stock} units available
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 font-bold text-lg">
                        −
                      </button>
                      <span className="px-6 py-2.5 font-semibold text-base min-w-[3rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 font-bold text-lg">
                        +
                      </button>
                    </div>
                    <button onClick={() => addToCart(product._id, quantity)}
                      className="flex-1 flex items-center justify-center gap-2
                        bg-primary text-white py-3 rounded-xl font-semibold
                        hover:bg-blue-700 transition min-w-[160px]">
                      <FiShoppingCart /> Add to Cart
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600 font-semibold">Out of Stock</p>
                  <p className="text-red-500 text-sm mt-1">
                    This product is currently unavailable
                  </p>
                </div>
              )}
            </div>

            {/* Trust badges */}
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              {[
                { icon:<FiTruck size={18} className="text-green-500 mx-auto"/>, text:"Free Delivery", sub:"Above ₹999" },
                { icon:<FiShield size={18} className="text-blue-500 mx-auto"/>, text:"7-Day Return",  sub:"Easy returns" },
                { icon:<FiRefreshCw size={18} className="text-purple-500 mx-auto"/>, text:"Genuine",sub:"100% authentic" },
              ].map((b) => (
                <div key={b.text} className="bg-gray-50 rounded-lg p-2">
                  {b.icon}
                  <p className="text-xs font-medium text-gray-700 mt-1">{b.text}</p>
                  <p className="text-xs text-gray-400">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mt-6">
          <div className="flex border-b overflow-x-auto">
            {[
              { key:"description",    label:"Description"                          },
              { key:"specifications", label:"Specifications"                       },
              { key:"reviews",        label:`Reviews (${product.numReviews})`      },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition
                  ${activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Description */}
            {activeTab === "description" && (
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                {product.description}
              </p>
            )}

            {/* Specifications */}
            {activeTab === "specifications" && (
              product.specifications?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {product.specifications.map((spec, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                          <td className="py-2.5 px-4 font-semibold text-gray-700 w-40 border-r">
                            {spec.key}
                          </td>
                          <td className="py-2.5 px-4 text-gray-600">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-gray-500 text-sm">No specifications available.</p>
            )}

            {/* Reviews */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                {/* Average rating display */}
                {product.numReviews > 0 && (
                  <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-gray-900">{product.rating}</p>
                      <div className="text-yellow-400 text-lg mt-1">
                        {"★".repeat(Math.round(product.rating))}
                        {"☆".repeat(5 - Math.round(product.rating))}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {product.numReviews} review{product.numReviews !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                )}

                {/* Review Form */}
                {user ? (
                  <form onSubmit={handleReviewSubmit}
                    className="bg-blue-50 rounded-xl p-5 space-y-4 border border-blue-100">
                    <h3 className="font-semibold text-gray-800">Write a Review</h3>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-2">
                        Your Rating
                      </label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map((r) => (
                          <button key={r} type="button"
                            onClick={() => setReview({ ...review, rating: r })}
                            className={`text-3xl transition-transform hover:scale-110
                              ${r <= review.rating ? "text-yellow-400" : "text-gray-300"}`}>
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Your Review
                      </label>
                      <textarea value={review.comment}
                        onChange={(e) => setReview({ ...review, comment: e.target.value })}
                        placeholder="Share your experience with this product..."
                        rows={4}
                        className="w-full border rounded-lg px-3 py-2 text-sm
                          focus:outline-none focus:border-primary"
                      />
                    </div>
                    <button type="submit" disabled={submitting}
                      className="bg-primary text-white px-8 py-2.5 rounded-lg
                        font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                      {submitting ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-5 text-center border">
                    <p className="text-gray-600 text-sm mb-3">
                      Login to write a review
                    </p>
                    <Link to="/login"
                      className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium">
                      Login
                    </Link>
                  </div>
                )}

                {/* Reviews List */}
                {product.reviews?.length > 0 ? (
                  <div className="space-y-4">
                    {product.reviews.map((r) => (
                      <div key={r._id} className="border-b pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary text-white
                                flex items-center justify-center font-bold text-sm">
                                {r.name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">{r.name}</p>
                                <div className="flex text-yellow-400 text-xs">
                                  {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(r.createdAt).toLocaleDateString("en-IN", {
                              day:"numeric", month:"short", year:"numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {r.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No reviews yet. Be the first to review this product!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {related.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
