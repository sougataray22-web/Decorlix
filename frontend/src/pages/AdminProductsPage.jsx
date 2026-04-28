// frontend/src/pages/AdminProductsPage.jsx
import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { FiEdit2, FiTrash2, FiPlus, FiUpload } from "react-icons/fi";

const EMPTY_FORM = {
  name:"", description:"", shortDescription:"", price:"", discountPrice:"",
  category:"", brand:"", stock:"", sku:"", tags:"", isFeatured:false,
  specifications:[{ key:"", value:"" }],
};

export default function AdminProductsPage() {
  const [products,     setProducts]     = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [editId,       setEditId]       = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [images,       setImages]       = useState([]);
  const [uploading,    setUploading]    = useState(false);
  const [uploadedImgs, setUploadedImgs] = useState([]);
  const [saving,       setSaving]       = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get("/products/admin/all"),
        api.get("/products/categories"),
      ]);
      setProducts(prodRes.data.products || []);
      setCategories(catRes.data.categories || []);
    } catch (_) { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  const handleUploadImages = async () => {
    if (!images.length) return toast.error("Select images first");
    setUploading(true);
    try {
      const formData = new FormData();
      images.forEach((img) => formData.append("images", img));
      const { data } = await api.post("/upload/product-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadedImgs([...uploadedImgs, ...data.images]);
      setImages([]);
      toast.success(`${data.images.length} image(s) uploaded!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category || !form.stock)
      return toast.error("Name, price, category, and stock are required.");
    setSaving(true);
    try {
      const payload = {
        ...form,
        price:          Number(form.price),
        discountPrice:  Number(form.discountPrice) || 0,
        stock:          Number(form.stock),
        tags:           form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
        images:         uploadedImgs,
        specifications: form.specifications.filter((s) => s.key && s.value),
      };
      if (editId) { await api.put(`/products/${editId}`, payload); toast.success("Product updated!"); }
      else        { await api.post("/products", payload);           toast.success("Product created!"); }
      setShowForm(false); setEditId(null); setForm(EMPTY_FORM); setUploadedImgs([]);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleEdit = (product) => {
    setEditId(product._id);
    setForm({
      name: product.name, description: product.description,
      shortDescription: product.shortDescription || "",
      price: product.price, discountPrice: product.discountPrice || "",
      category: product.category?._id || product.category, brand: product.brand || "",
      stock: product.stock, sku: product.sku || "",
      tags: product.tags?.join(", ") || "", isFeatured: product.isFeatured,
      specifications: product.specifications?.length ? product.specifications : [{ key:"", value:"" }],
    });
    setUploadedImgs(product.images || []);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted.");
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
  };

  const updateSpec = (i, field, value) => {
    const s = [...form.specifications];
    s[i][field] = value;
    setForm({ ...form, specifications: s });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); setUploadedImgs([]); }}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-xl font-medium hover:bg-blue-700">
          <FiPlus /> Add Product
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4">{editId ? "Edit Product" : "Add New Product"}</h2>
          <div className="grid md:grid-cols-2 gap-4">

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-600">Product Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-primary" />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-600">Description *</label>
              <textarea value={form.description} rows={3} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-primary" />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-600">Short Description</label>
              <input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-primary" />
            </div>

            {[
              { key:"price",         label:"Price (₹) *",          type:"number" },
              { key:"discountPrice", label:"Discount Price (₹)",   type:"number" },
              { key:"stock",         label:"Stock *",               type:"number" },
              { key:"sku",           label:"SKU",                   type:"text"   },
              { key:"brand",         label:"Brand",                 type:"text"   },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-600">{label}</label>
                <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-primary" />
              </div>
            ))}

            <div>
              <label className="text-sm font-medium text-gray-600">Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-primary">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-600">Tags (comma-separated)</label>
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="clock, wooden, wall decor"
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:border-primary" />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="featured" checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
              <label htmlFor="featured" className="text-sm font-medium text-gray-600">Mark as Featured</label>
            </div>
          </div>

          {/* Specifications */}
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-600">Specifications</label>
            {form.specifications.map((spec, i) => (
              <div key={i} className="flex gap-2 mt-2">
                <input placeholder="Key (e.g. Material)" value={spec.key}
                  onChange={(e) => updateSpec(i, "key", e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="Value (e.g. Wood)" value={spec.value}
                  onChange={(e) => updateSpec(i, "value", e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                <button type="button" onClick={() => {
                  const s = form.specifications.filter((_, j) => j !== i);
                  setForm({ ...form, specifications: s.length ? s : [{ key:"", value:"" }] });
                }} className="text-red-400 hover:text-red-600 px-2">✕</button>
              </div>
            ))}
            <button type="button"
              onClick={() => setForm({ ...form, specifications: [...form.specifications, { key:"", value:"" }] })}
              className="mt-2 text-sm text-primary hover:underline">
              + Add specification
            </button>
          </div>

          {/* Image Upload */}
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-600">Product Images</label>
            <div className="flex gap-2 mt-2">
              <input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files))}
                className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <button type="button" onClick={handleUploadImages} disabled={uploading || !images.length}
                className="flex items-center gap-1 bg-secondary text-white px-4 rounded-lg text-sm font-medium hover:bg-amber-500 disabled:opacity-50">
                <FiUpload size={14} /> {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
            {uploadedImgs.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {uploadedImgs.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img.url} alt="" className="w-20 h-20 object-cover rounded-lg border" />
                    <button type="button"
                      onClick={() => setUploadedImgs(uploadedImgs.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={saving}
              className="bg-primary text-white px-8 py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : editId ? "Update Product" : "Create Product"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}
              className="border px-6 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="bg-white rounded-xl h-64 animate-pulse" />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Image","Name","Category","Price","Stock","Status","Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-semibold text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img src={p.images?.[0]?.url || "/placeholder.png"} alt={p.name}
                        className="w-12 h-12 object-cover rounded-lg" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 line-clamp-2 max-w-xs">{p.name}</p>
                      {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.category?.name}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold">₹{(p.discountPrice || p.price)?.toLocaleString("en-IN")}</p>
                      {p.discountPrice > 0 && (
                        <p className="text-xs text-gray-400 line-through">₹{p.price?.toLocaleString("en-IN")}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${p.stock === 0 ? "text-red-500" : p.stock <= 5 ? "text-orange-500" : "text-green-600"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${p.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700 p-1.5 rounded hover:bg-blue-50">
                          <FiEdit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(p._id, p.name)} className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50">
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="text-center py-12 text-gray-500">No products yet. Add your first product above.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
