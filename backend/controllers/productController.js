// backend/controllers/productController.js
const asyncHandler = require("express-async-handler");
const mongoose     = require("mongoose");
const Product      = require("../models/productModel");
const Category     = require("../models/categoryModel");

// ── CATEGORIES ────────────────────────────────────────────────────────────────
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, parent } = req.body;
  if (!name) { res.status(400); throw new Error("Category name is required."); }
  const existing = await Category.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
  if (existing) { res.status(409); throw new Error("Category with this name already exists."); }
  const category = await Category.create({ name, description, image, parent: parent || null });
  res.status(201).json({ success: true, category });
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).populate("parent", "name slug").sort({ name: 1 });
  res.status(200).json({ success: true, categories });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) { res.status(404); throw new Error("Category not found."); }
  const { name, description, image, isActive, parent } = req.body;
  if (name !== undefined)        category.name        = name;
  if (description !== undefined) category.description = description;
  if (image !== undefined)       category.image       = image;
  if (isActive !== undefined)    category.isActive    = isActive;
  if (parent !== undefined)      category.parent      = parent;
  const updated = await category.save();
  res.status(200).json({ success: true, category: updated });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) { res.status(404); throw new Error("Category not found."); }
  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount > 0) { res.status(400); throw new Error(`Cannot delete. ${productCount} product(s) are using this category.`); }
  await category.deleteOne();
  res.status(200).json({ success: true, message: "Category deleted." });
});

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, shortDescription, price, discountPrice, category,
          brand, images, specifications, stock, sku, tags, isFeatured, weight, dimensions } = req.body;
  if (!name || !description || !price || !category) { res.status(400); throw new Error("Name, description, price, and category are required."); }
  if (!mongoose.Types.ObjectId.isValid(category)) { res.status(400); throw new Error("Invalid category ID."); }
  const categoryExists = await Category.findById(category);
  if (!categoryExists) { res.status(404); throw new Error("Category not found."); }
  if (discountPrice && discountPrice >= price) { res.status(400); throw new Error("Discount price must be less than original price."); }
  if (sku) {
    const skuExists = await Product.findOne({ sku });
    if (skuExists) { res.status(409); throw new Error("A product with this SKU already exists."); }
  }
  const product = await Product.create({
    name, description, shortDescription, price, discountPrice: discountPrice || 0,
    category, brand, images: images || [], specifications: specifications || [],
    stock, sku, tags: tags || [], isFeatured: isFeatured || false,
    weight: weight || 0, dimensions: dimensions || {}, createdBy: req.user._id,
  });
  const populated = await product.populate("category", "name slug");
  res.status(201).json({ success: true, message: "Product created successfully.", product: populated });
});

const getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, minPrice, maxPrice, minRating, brand, isFeatured, sort, page = 1, limit = 12 } = req.query;
  const filter = { isActive: true };
  if (keyword && keyword.trim()) {
    filter.$or = [
      { name: { $regex: keyword.trim(), $options: "i" } },
      { description: { $regex: keyword.trim(), $options: "i" } },
      { tags: { $in: [new RegExp(keyword.trim(), "i")] } },
      { brand: { $regex: keyword.trim(), $options: "i" } },
    ];
  }
  if (category) {
    if (mongoose.Types.ObjectId.isValid(category)) filter.category = category;
    else {
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.category = cat._id;
    }
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (minRating) filter.rating = { $gte: Number(minRating) };
  if (brand) filter.brand = { $regex: brand.trim(), $options: "i" };
  if (isFeatured === "true") filter.isFeatured = true;
  let sortObj = { createdAt: -1 };
  if (sort === "price_asc")  sortObj = { price: 1 };
  if (sort === "price_desc") sortObj = { price: -1 };
  if (sort === "rating")     sortObj = { rating: -1 };
  if (sort === "popular")    sortObj = { sold: -1 };
  if (sort === "discount")   sortObj = { discountPercent: -1 };
  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip     = (pageNum - 1) * limitNum;
  const [products, totalCount] = await Promise.all([
    Product.find(filter).populate("category", "name slug").sort(sortObj).skip(skip).limit(limitNum).select("-reviews -specifications -__v"),
    Product.countDocuments(filter),
  ]);
  const totalPages = Math.ceil(totalCount / limitNum);
  res.status(200).json({ success: true, totalCount, totalPages, currentPage: pageNum, limit: limitNum,
    hasNextPage: pageNum < totalPages, hasPrevPage: pageNum > 1, products });
});

const searchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.status(200).json({ success: true, suggestions: [] });
  const suggestions = await Product.find({ isActive: true, name: { $regex: q.trim(), $options: "i" } })
    .select("name slug images price discountPrice").limit(8).lean();
  res.status(200).json({ success: true, suggestions });
});

const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true, isFeatured: true })
    .populate("category", "name slug").sort({ createdAt: -1 }).limit(10).select("-reviews -__v");
  res.status(200).json({ success: true, products });
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let product;
  if (mongoose.Types.ObjectId.isValid(id)) {
    product = await Product.findById(id).populate("category", "name slug").populate("reviews.user", "name avatar");
  } else {
    product = await Product.findOne({ slug: id, isActive: true }).populate("category", "name slug").populate("reviews.user", "name avatar");
  }
  if (!product || !product.isActive) { res.status(404); throw new Error("Product not found."); }
  const related = await Product.find({ category: product.category._id, _id: { $ne: product._id }, isActive: true })
    .select("name slug images price discountPrice rating numReviews").limit(6).lean();
  res.status(200).json({ success: true, product, related });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error("Product not found."); }
  const { name, description, shortDescription, price, discountPrice, category,
          brand, images, specifications, stock, sku, tags, isFeatured, isActive, weight, dimensions } = req.body;
  if (category && !mongoose.Types.ObjectId.isValid(category)) { res.status(400); throw new Error("Invalid category ID."); }
  if (category) { const cat = await Category.findById(category); if (!cat) { res.status(404); throw new Error("Category not found."); } }
  const newPrice = price || product.price;
  const newDiscount = discountPrice !== undefined ? discountPrice : product.discountPrice;
  if (newDiscount && newDiscount >= newPrice) { res.status(400); throw new Error("Discount price must be less than original price."); }
  if (name !== undefined)             product.name             = name;
  if (description !== undefined)      product.description      = description;
  if (shortDescription !== undefined) product.shortDescription = shortDescription;
  if (price !== undefined)            product.price            = price;
  if (discountPrice !== undefined)    product.discountPrice    = discountPrice;
  if (category !== undefined)         product.category         = category;
  if (brand !== undefined)            product.brand            = brand;
  if (images !== undefined)           product.images           = images;
  if (specifications !== undefined)   product.specifications   = specifications;
  if (stock !== undefined)            product.stock            = stock;
  if (sku !== undefined)              product.sku              = sku;
  if (tags !== undefined)             product.tags             = tags;
  if (isFeatured !== undefined)       product.isFeatured       = isFeatured;
  if (isActive !== undefined)         product.isActive         = isActive;
  if (weight !== undefined)           product.weight           = weight;
  if (dimensions !== undefined)       product.dimensions       = dimensions;
  const updated  = await product.save();
  const populated = await updated.populate("category", "name slug");
  res.status(200).json({ success: true, message: "Product updated successfully.", product: populated });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error("Product not found."); }
  product.isActive = false;
  await product.save();
  res.status(200).json({ success: true, message: "Product removed successfully." });
});

const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || !comment) { res.status(400); throw new Error("Rating and comment are required."); }
  if (rating < 1 || rating > 5) { res.status(400); throw new Error("Rating must be between 1 and 5."); }
  const product = await Product.findById(req.params.id);
  if (!product || !product.isActive) { res.status(404); throw new Error("Product not found."); }
  const existingIndex = product.reviews.findIndex((r) => r.user.toString() === req.user._id.toString());
  if (existingIndex !== -1) {
    product.reviews[existingIndex].rating  = Number(rating);
    product.reviews[existingIndex].comment = comment;
    product.reviews[existingIndex].name    = req.user.name;
  } else {
    product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
  }
  product.updateRating();
  await product.save();
  res.status(existingIndex !== -1 ? 200 : 201).json({
    success: true, message: existingIndex !== -1 ? "Review updated." : "Review added.",
    rating: product.rating, numReviews: product.numReviews,
  });
});

const deleteReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error("Product not found."); }
  const reviewIndex = product.reviews.findIndex((r) => r.user.toString() === req.user._id.toString());
  if (reviewIndex === -1) { res.status(404); throw new Error("You have not reviewed this product."); }
  product.reviews.splice(reviewIndex, 1);
  product.updateRating();
  await product.save();
  res.status(200).json({ success: true, message: "Review deleted." });
});

const adminGetAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, keyword, isActive } = req.query;
  const filter = {};
  if (keyword) filter.name = { $regex: keyword.trim(), $options: "i" };
  if (isActive !== undefined) filter.isActive = isActive === "true";
  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip     = (pageNum - 1) * limitNum;
  const [products, totalCount] = await Promise.all([
    Product.find(filter).populate("category", "name").sort({ createdAt: -1 }).skip(skip).limit(limitNum).select("-reviews -__v"),
    Product.countDocuments(filter),
  ]);
  res.status(200).json({ success: true, totalCount, totalPages: Math.ceil(totalCount / limitNum), currentPage: pageNum, products });
});

module.exports = {
  createCategory, getCategories, updateCategory, deleteCategory,
  createProduct, getProducts, getProductById, updateProduct, deleteProduct,
  getFeaturedProducts, searchSuggestions, adminGetAllProducts,
  addReview, deleteReview,
};
