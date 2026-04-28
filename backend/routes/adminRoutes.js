// backend/routes/adminRoutes.js
const express = require("express");
const router  = express.Router();
const { getDashboardStats, getAllUsers, getUserById, updateUserRole, deleteUser,
        getInventory, updateStock, getRevenueAnalytics } = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.use(protect, adminOnly);
router.get("/dashboard",           getDashboardStats);
router.get("/users",               getAllUsers);
router.get("/users/:id",           getUserById);
router.put("/users/:id/role",      updateUserRole);
router.delete("/users/:id",        deleteUser);
router.get("/inventory",           getInventory);
router.put("/inventory/:id/stock", updateStock);
router.get("/analytics/revenue",   getRevenueAnalytics);

module.exports = router;
