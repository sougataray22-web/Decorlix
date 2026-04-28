// backend/routes/cartRoutes.js
const express = require("express");
const router  = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/",              getCart);
router.post("/",             addToCart);
router.put("/:productId",    updateCartItem);
router.delete("/clear",      clearCart);
router.delete("/:productId", removeFromCart);

module.exports = router;
