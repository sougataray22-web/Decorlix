// frontend/src/pages/ProductsPage.jsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import { FiFilter, FiX } from "react-icons/fi";

const SORT_OPTIONS = [
  { value:"newest",     label:"Newest First"        },
  { value:"price_asc",  label:"Price: Low to High"  },
  { value:"price_desc", label:"Price: High to Low"  },
  { value:"rating",     label:"Top Rated"            },
  { value:"popular",    label:"Most Popular"         },
  { value:"discount",   label:"Best Discount"        },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [totalCount,  setTotalCount]  = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [priceInput,  setPriceInput]  = useState({ min:"", max:"" });

  const keyword    = searchParams.get("keyword")    || "";
  const category   = searchParams.get("category")   || "";
  const sort       = searchParams.get("sort")        || "newest";
  const page       = parseInt(searchParams.get("page") || "1");
  const minPrice   = searchParams.get("minPrice")   || "";
  const maxPrice   = searchParams.get("maxPrice")   || "";
  const minRating  = searchParams.get("minRating")  || "";
  const isFeatured = searchParams.get("isFeatured") || "";

  useEffect(() => {
    setPriceInput({ min: minPrice, max: maxPrice });
  }, [minPrice, maxPrice]);

  useEffect(() => { fetchProducts(); }, [searchParams]);

  useEffect(() => {
    api.get("/products/categories")
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword)    params.set("keyword",    keyword);
      if (category)   params.set("category",   category);
      if (sort)       params.set("sort",        sort);
      if (page)       params.set("page",        page);
      if (minPrice)   params.set("minPrice",    minPrice);
      if (maxPrice)   params.set("maxPrice",    maxPrice);
      if (minRating)  params.set("minRating",   minRating);
      if (isFeatured) params.set("isFeatured",  isFeatured);
      params.set("limit", "16");
      const { data } = await api.get(`/products?${params.toString()}`);
      setProducts(data.products || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (_) { setProducts([]); }
    finally { setLoading(false); }
  };

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete("page");
    setSearchParams(p);
  };

  const applyPrice = () => {
    const p = new URLSearchParams(searchParams);
    if (priceInput.min) p.set("minPrice", priceInput.min); else p.delete("minPrice");
    if (priceInput.max) p.set("maxPrice", priceInput.max); else p.delete("maxPrice");
    p.delete("page");
    setSearchParams(p);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {keyword ? `Results for "${keyword}"` : category ? `Category: ${category}` : "All Products"}
            </h1>
            <p className="text-sm text-gray-500">{totalCount} products found</p>
          </div>

          <div className="flex gap-3 items-center">
            <select value={sort} onChange={(e) => updateParam("sort", e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none
                focus:border-primary bg-white">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-1 border rounded-lg
                px-3 py-2 text-sm bg-white">
              <FiFilter size={14} /> Filters
            </button>
          </div>
        </div>

        {/* Active filters */}
        {(keyword || category || minPrice || maxPrice || minRating || isFeatured) && (
          <div className="flex gap-2 flex-wrap mb-4">
            {keyword    && <FilterTag label={`Search: ${keyword}`}    onRemove={() => updateParam("keyword", "")}    />}
            {category   && <FilterTag label={`Category: ${category}`} onRemove={() => updateParam("category", "")}  />}
            {minPrice   && <FilterTag label={`Min: ₹${minPrice}`}     onRemove={() => updateParam("minPrice", "")}   />}
            {maxPrice   && <FilterTag label={`Max: ₹${maxPrice}`}     onRemove={() => updateParam("maxPrice", "")}   />}
            {minRating  && <FilterTag label={`${minRating}★ & above`} onRemove={() => updateParam("minRating", "")}  />}
            {isFeatured && <FilterTag label="Featured"                onRemove={() => updateParam("isFeatured", "")} />}
            <button onClick={() => setSearchParams({})}
              className="text-xs text-red-500 hover:underline px-2">
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-6">

          {/* Filters Sidebar */}
          <aside className={`${showFilters ? "block" : "hidden"} md:block w-60 flex-shrink-0`}>
            <div className="bg-white rounded-xl border p-4 space-y-5 sticky top-20">

              <div>
                <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                  Category
                </h3>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="cat" value=""
                      checked={!category}
                      onChange={() => updateParam("category", "")}
                      className="text-primary"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-primary">All</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat._id} className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="cat" value={cat.slug}
                        checked={category === cat.slug}
                        onChange={() => updateParam("category", cat.slug)}
                        className="text-primary"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-primary">
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                  Price Range
                </h3>
                <div className="flex gap-2 mb-2">
                  <input type="number" placeholder="Min"
                    value={priceInput.min}
                    onChange={(e) => setPriceInput({ ...priceInput, min: e.target.value })}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                  />
                  <input type="number" placeholder="Max"
                    value={priceInput.max}
                    onChange={(e) => setPriceInput({ ...priceInput, max: e.target.value })}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <button onClick={applyPrice}
                  className="w-full bg-primary/10 text-primary text-xs py-1.5
                    rounded font-medium hover:bg-primary/20">
                  Apply
                </button>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                  Min Rating
                </h3>
                {[4, 3, 2].map((r) => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="radio" name="rating" value={r}
                      checked={minRating === String(r)}
                      onChange={() => updateParam("minRating", String(r))}
                    />
                    <span className="text-yellow-400 text-sm">{"★".repeat(r)}{"☆".repeat(5-r)}</span>
                    <span className="text-xs text-gray-500">& above</span>
                  </label>
                ))}
                {minRating && (
                  <button onClick={() => updateParam("minRating", "")}
                    className="text-xs text-primary hover:underline">Clear</button>
                )}
              </div>

              <button onClick={() => setSearchParams({})}
                className="w-full border border-red-300 text-red-500 rounded-lg
                  py-2 text-sm hover:bg-red-50">
                Reset All Filters
              </button>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array(16).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl h-72 animate-pulse border" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((p) => <ProductCard key={p._id} product={p} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8 flex-wrap">
                    <button disabled={page <= 1}
                      onClick={() => updateParam("page", String(page - 1))}
                      className="px-4 py-2 border rounded-lg text-sm bg-white
                        disabled:opacity-40 hover:bg-gray-50">
                      ← Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce((acc, p, i, arr) => {
                        if (i > 0 && arr[i-1] !== p - 1) acc.push("...");
                        acc.push(p); return acc;
                      }, [])
                      .map((p, i) =>
                        p === "..." ? (
                          <span key={i} className="px-3 py-2 text-gray-400">...</span>
                        ) : (
                          <button key={p} onClick={() => updateParam("page", String(p))}
                            className={`px-4 py-2 border rounded-lg text-sm
                              ${page === p ? "bg-primary text-white border-primary" : "bg-white hover:bg-gray-50"}`}>
                            {p}
                          </button>
                        )
                      )}
                    <button disabled={page >= totalPages}
                      onClick={() => updateParam("page", String(page + 1))}
                      className="px-4 py-2 border rounded-lg text-sm bg-white
                        disabled:opacity-40 hover:bg-gray-50">
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterTag({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1 bg-blue-50 text-primary text-xs
      px-3 py-1 rounded-full border border-blue-200">
      {label}
      <button onClick={onRemove} className="ml-1 hover:text-red-500">
        <FiX size={12} />
      </button>
    </span>
  );
}
