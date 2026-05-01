// backend/routes/paymentRoutes.js
const express = require("express");
const { initiatePayment, verifyPayment, getTransaction } = require("../controllers/paymentController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/initiate", protect, initiatePayment);
router.post("/verify", protect, verifyPayment);
router.get("/transaction/:orderId", protect, getTransaction);

module.exports = router;