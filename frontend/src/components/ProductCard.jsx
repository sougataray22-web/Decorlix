// frontend/src/components/ProductCard.jsx
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { FiShoppingCart, FiStar } from "react-icons/fi";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  const displayPrice = product.discountPrice > 0 ? product.discountPrice : product.price;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow
      border border-gray-100 flex flex-col overflow-hidden group">

      {/* Image */}
      <Link to={`/products/${product.slug || product._id}`}>
        <div className="relative overflow-hidden bg-gray-50 h-52">
          <img
            src={product.images?.[0]?.url || "/placeholder.png"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105
              transition-transform duration-300"
            onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=No+Image"; }}
          />
          {product.discountPercent > 0 && (
            <span className="absolute top-2 left-2 bg-green-500 text-white
              text-xs px-2 py-0.5 rounded-full font-medium">
              {product.discountPercent}% OFF
            </span>
          )}
          {product.isFeatured && (
            <span className="absolute top-2 right-2 bg-secondary text-white
              text-xs px-2 py-0.5 rounded-full font-medium">
              ⭐ Featured
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <Link to={`/products/${product.slug || product._id}`}>
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2
            hover:text-primary transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-gray-400 mt-0.5">{product.brand}</p>
        )}

        {/* Rating */}
        {product.numReviews > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="bg-green-500 text-white text-xs px-1.5 py-0.5
              rounded flex items-center gap-0.5 font-medium">
              {product.rating} <FiStar size={9} />
            </span>
            <span className="text-xs text-gray-400">({product.numReviews})</span>
          </div>
        )}

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-base font-bold text-gray-900">
            ₹{displayPrice.toLocaleString("en-IN")}
          </span>
          {product.discountPrice > 0 && (
            <span className="text-xs text-gray-400 line-through">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Free shipping badge */}
        {displayPrice >= 999 && (
          <p className="text-xs text-green-600 mt-0.5">✓ Free Delivery</p>
        )}

        {/* Add to cart button */}
        <button
          disabled={product.stock === 0}
          onClick={(e) => { e.preventDefault(); addToCart(product._id); }}
          className="mt-3 w-full flex items-center justify-center gap-1.5
            bg-primary text-white py-2 rounded-lg text-sm font-medium
            hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-colors"
        >
          <FiShoppingCart size={13} />
          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
