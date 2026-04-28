// backend/routes/productRoutes.js
const express = require("express");
const router  = express.Router();
const { createCategory, getCategories, updateCategory, deleteCategory,
        createProduct, getProducts, getProductById, updateProduct, deleteProduct,
        getFeaturedProducts, searchSuggestions, adminGetAllProducts, addReview, deleteReview } = require("../controllers/productController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/categories",         getCategories);
router.post("/categories",        protect, adminOnly, createCategory);
router.put("/categories/:id",     protect, adminOnly, updateCategory);
router.delete("/categories/:id",  protect, adminOnly, deleteCategory);

router.get("/featured",           getFeaturedProducts);
router.get("/search-suggestions", searchSuggestions);
router.get("/admin/all",          protect, adminOnly, adminGetAllProducts);

router.get("/",                   getProducts);
router.post("/",                  protect, adminOnly, createProduct);
router.get("/:id",                getProductById);
router.put("/:id",                protect, adminOnly, updateProduct);
router.delete("/:id",             protect, adminOnly, deleteProduct);

router.post("/:id/reviews",       protect, addReview);
router.delete("/:id/reviews",     protect, deleteReview);

module.exports = router;
