// backend/routes/paymentRoutes.js
const express = require("express");
const router  = express.Router();
const { initiatePayment, verifyPayment, webhookHandler, getTransaction } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

router.post("/initiate",              protect, initiatePayment);
router.post("/verify",                protect, verifyPayment);
router.post("/webhook",               webhookHandler);
router.get("/transaction/:orderId",   protect, getTransaction);

module.exports = router;
