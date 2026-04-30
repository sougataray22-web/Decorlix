// backend/controllers/paymentController.js
const asyncHandler = require("express-async-handler");
const Order = require("../models/orderModel");
const Transaction = require("../models/transactionModel");
const axios = require("axios");
const crypto = require("crypto");

const CASHFREE_URL = process.env.CASHFREE_ENV === "TEST"
  ? "https://sandbox.cashfree.com/pg"
  : "https://api.cashfree.com/pg";

const generateOrderId = () => `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getSignature = (data, secretKey) => {
  const message = `${data.orderId}.${data.orderAmount}.${data.orderCurrency}`;
  return crypto.createHmac("sha256", secretKey).update(message).digest("base64");
};

const initiatePayment = asyncHandler(async (req, res) => {
  const { orderId, amount, customerEmail, customerPhone, returnUrl } = req.body;

  if (!orderId || !amount || !customerEmail || !customerPhone) {
    res.status(400);
    throw new Error("Missing required fields: orderId, amount, customerEmail, customerPhone.");
  }

  if (amount < 1) {
    res.status(400);
    throw new Error("Amount must be at least ₹1.");
  }

  try {
    const orderPayload = {
      order_id: orderId,
      order_amount: parseFloat(amount).toFixed(2),
      order_currency: "INR",
      customer_details: {
        customer_id: req.user._id.toString(),
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: returnUrl || `${process.env.FRONTEND_URL}/payment/verify`,
      },
      order_note: "Decorlix Order Payment",
    };

    const headers = {
      "x-api-version": "2023-08-01",
      "x-client-id": process.env.CASHFREE_APP_ID,
      "x-client-secret": process.env.CASHFREE_SECRET_KEY,
      "Content-Type": "application/json",
    };

    const response = await axios.post(`${CASHFREE_URL}/orders`, orderPayload, { headers });

    if (response.status !== 200) {
      res.status(400);
      throw new Error("Failed to create Cashfree order.");
    }

    const { order_id, payment_session_id } = response.data;

    await Transaction.create({
      orderId: order_id,
      userId: req.user._id,
      amount: parseFloat(amount),
      status: "pending",
      method: "cashfree",
      sessionId: payment_session_id,
    });

    res.status(200).json({
      success: true,
      message: "Payment session created.",
      orderId: order_id,
      paymentSessionId: payment_session_id,
      redirectUrl: `${CASHFREE_URL}/orders/${order_id}?key=${process.env.CASHFREE_APP_ID}`,
    });
  } catch (err) {
    console.error("Payment Initiation Error:", err.response?.data || err.message);
    res.status(err.response?.status || 500);
    throw new Error(err.response?.data?.message || "Payment initiation failed.");
  }
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentSessionId } = req.body;

  if (!orderId || !paymentSessionId) {
    res.status(400);
    throw new Error("orderId and paymentSessionId are required.");
  }

  try {
    const headers = {
      "x-api-version": "2023-08-01",
      "x-client-id": process.env.CASHFREE_APP_ID,
      "x-client-secret": process.env.CASHFREE_SECRET_KEY,
    };

    const response = await axios.get(
      `${CASHFREE_URL}/orders/${orderId}/payments`,
      { headers }
    );

    if (!response.data || response.data.length === 0) {
      res.status(400);
      throw new Error("No payment found for this order.");
    }

    const payment = response.data[0];
    const { cf_payment_id, payment_status, order_id } = payment;

    if (payment_status === "SUCCESS") {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { 
          paymentStatus: "completed",
          paymentId: cf_payment_id,
          transactionId: cf_payment_id,
        },
        { new: true }
      ).populate("items.product");

      await Transaction.updateOne(
        { sessionId: paymentSessionId },
        { 
          status: "success", 
          paymentId: cf_payment_id,
          verifiedAt: new Date(),
        }
      );

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully.",
        order,
        paymentStatus: "success",
      });
    } else if (payment_status === "FAILED" || payment_status === "CANCELLED") {
      await Transaction.updateOne(
        { sessionId: paymentSessionId },
        { status: "failed" }
      );

      res.status(400);
      throw new Error(`Payment ${payment_status.toLowerCase()}.`);
    } else {
      res.status(400);
      throw new Error("Payment is still pending or in processing.");
    }
  } catch (err) {
    console.error("Payment Verification Error:", err.message);
    res.status(err.response?.status || 500);
    throw new Error(err.response?.data?.message || "Payment verification failed.");
  }
});

const getTransaction = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const transaction = await Transaction.findOne({ 
    orderId, 
    userId: req.user._id 
  });

  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found.");
  }

  res.status(200).json({ 
    success: true, 
    transaction 
  });
});

module.exports = { 
  initiatePayment, 
  verifyPayment, 
  getTransaction 
};