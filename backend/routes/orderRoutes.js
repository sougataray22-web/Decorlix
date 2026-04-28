// backend/routes/orderRoutes.js
const express = require("express");
const router  = express.Router();
const { placeOrder, getMyOrders, getOrderById, cancelOrder, requestReturn,
        adminGetAllOrders, adminUpdateOrderStatus, adminUpdatePaymentStatus } = require("../controllers/orderController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/",              protect, placeOrder);
router.get("/my-orders",      protect, getMyOrders);
router.get("/admin/all",      protect, adminOnly, adminGetAllOrders);
router.get("/:id",            protect, getOrderById);
router.put("/:id/cancel",     protect, cancelOrder);
router.put("/:id/return",     protect, requestReturn);
router.put("/admin/:id/status",  protect, adminOnly, adminUpdateOrderStatus);
router.put("/admin/:id/payment", protect, adminOnly, adminUpdatePaymentStatus);

module.exports = router;
