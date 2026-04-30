// backend/controllers/paymentController.js
const asyncHandler = require("express-async-handler");
const Order = require("../models/orderModel");
const Transaction = require("../models/transactionModel");
const axios = require("axios");
const crypto = require("crypto");

const CASHFREE_URL = process.env.CASHFREE_ENV === "TEST"
  ? "https://sandbox.cashfree.com/pg"
  : "https://api.cashfree.com/pg";

const initiatePayment = asyncHandler(async (req, res) => {
  const { orderId, amount, customerEmail, customerPhone, returnUrl } = req.body;

  console.log("Payment Initiate Request:", { orderId, amount, customerEmail, customerPhone });

  if (!orderId || !amount || !customerEmail || !customerPhone) {
    res.status(400);
    throw new Error("Missing required fields: orderId, amount, customerEmail, customerPhone.");
  }

  if (parseFloat(amount) < 1) {
    res.status(400);
    throw new Error("Amount must be at least ₹1.");
  }

  try {
    const orderPayload = {
      order_id: orderId.toString(),
      order_amount: parseFloat(amount).toFixed(2),
      order_currency: "INR",
      customer_details: {
        customer_id: req.user._id.toString(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.toString(),
      },
      order_meta: {
        return_url: returnUrl || `${process.env.FRONTEND_URL}/payment/verify`,
      },
      order_note: "Decorlix Order Payment",
    };

    console.log("Cashfree Payload:", JSON.stringify(orderPayload, null, 2));

    const headers = {
      "x-api-version": "2023-08-01",
      "x-client-id": process.env.CASHFREE_APP_ID,
      "x-client-secret": process.env.CASHFREE_SECRET_KEY,
      "Content-Type": "application/json",
    };

    const response = await axios.post(`${CASHFREE_URL}/orders`, orderPayload, { headers });

    console.log("Cashfree Response:", response.data);

    if (!response.data || !response.data.payment_session_id) {
      res.status(400);
      throw new Error("Invalid response from Cashfree.");
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
      redirectUrl: `${CASHFREE_URL}/checkout/?sessionId=${payment_session_id}`,
    });
  } catch (err) {
    console.error("Cashfree Error Details:", {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
    });

    res.status(err.response?.status || 500);
    throw new Error(err.response?.data?.message || err.message || "Payment initiation failed.");
  }
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentSessionId } = req.body;

  if (!orderId) {
    res.status(400);
    throw new Error("orderId is required.");
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
    const { payment_status, cf_payment_id } = payment;

    if (payment_status === "SUCCESS") {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { 
          paymentStatus: "completed",
          paymentId: cf_payment_id,
        },
        { new: true }
      ).populate("items.product");

      if (paymentSessionId) {
        await Transaction.updateOne(
          { sessionId: paymentSessionId },
          { status: "success", paymentId: cf_payment_id }
        );
      }

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully.",
        order,
      });
    } else {
      res.status(400);
      throw new Error(`Payment ${payment_status.toLowerCase()}.`);
    }
  } catch (err) {
    console.error("Payment Verification Error:", err.message);
    res.status(err.response?.status || 500);
    throw new Error("Payment verification failed.");
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

  res.status(200).json({ success: true, transaction });
});

module.exports = { initiatePayment, verifyPayment, getTransaction };