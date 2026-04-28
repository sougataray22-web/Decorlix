// backend/controllers/paymentController.js
const asyncHandler = require("express-async-handler");
const crypto       = require("crypto");
const Order        = require("../models/orderModel");
const Transaction  = require("../models/transactionModel");
const Cart         = require("../models/cartModel");
const { createCashfreeOrder, verifyCashfreePayment, getCashfreePayments } = require("../config/cashfree");

const initiatePayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) { res.status(400); throw new Error("Order ID is required."); }
  const order = await Order.findById(orderId).populate("user","name email phone");
  if (!order) { res.status(404); throw new Error("Order not found."); }
  if (order.user._id.toString() !== req.user._id.toString()) { res.status(403); throw new Error("Not authorized."); }
  if (order.paymentStatus === "paid") { res.status(400); throw new Error("Order is already paid."); }
  const cashfreeOrderId = `DCX_${order.orderNumber}_${Date.now()}`;
  const returnUrl = `${process.env.FRONTEND_URL}/payment/verify?orderId=${order._id}&cashfreeOrderId=${cashfreeOrderId}`;
  const cashfreeOrder = await createCashfreeOrder({
    orderId: cashfreeOrderId, orderAmount: order.totalPrice,
    customerName: order.user.name, customerEmail: order.user.email,
    customerPhone: order.user.phone || "9999999999", returnUrl,
  });
  order.paymentDetails.cashfreeOrderId = cashfreeOrderId;
  await order.save();
  await Transaction.create({ order: order._id, user: req.user._id, cashfreeOrderId, amount: order.totalPrice, status: "initiated" });
  res.status(200).json({ success: true, cashfreeOrderId, paymentSessionId: cashfreeOrder.payment_session_id, orderAmount: order.totalPrice, orderCurrency: "INR" });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, cashfreeOrderId } = req.body;
  if (!orderId || !cashfreeOrderId) { res.status(400); throw new Error("orderId and cashfreeOrderId are required."); }
  const order = await Order.findById(orderId);
  if (!order) { res.status(404); throw new Error("Order not found."); }
  if (order.user.toString() !== req.user._id.toString()) { res.status(403); throw new Error("Not authorized."); }
  const cashfreeData = await verifyCashfreePayment(cashfreeOrderId);
  let paymentData = null;
  try { const payments = await getCashfreePayments(cashfreeOrderId); paymentData = Array.isArray(payments) ? payments[0] : null; } catch (_) {}
  const isSuccess = cashfreeData.order_status === "PAID" || paymentData?.payment_status === "SUCCESS";
  await Transaction.findOneAndUpdate({ cashfreeOrderId }, {
    status: isSuccess ? "success" : "failed",
    cashfreePaymentId: paymentData?.cf_payment_id || "",
    paymentMethod: paymentData?.payment_method || "",
    gatewayResponse: cashfreeData,
  });
  if (isSuccess) {
    order.paymentStatus = "paid";
    order.paymentDetails = { ...order.paymentDetails, cashfreePaymentId: paymentData?.cf_payment_id||"", paidAt: new Date(), method: paymentData?.payment_method||"", bankRef: paymentData?.bank_reference||"" };
    order.orderStatus = "confirmed";
    order.statusHistory.push({ status:"confirmed", message:"Payment received. Order confirmed.", updatedBy:req.user._id });
    await order.save();
    await Cart.findOneAndUpdate({ user:req.user._id }, { items:[], couponCode:"", couponDiscount:0 });
    return res.status(200).json({ success:true, paid:true, message:"Payment successful! Order confirmed.", order });
  }
  res.status(200).json({ success:true, paid:false, message:"Payment not completed.", orderStatus:cashfreeData.order_status });
});

const webhookHandler = asyncHandler(async (req, res) => {
  const signature = req.headers["x-webhook-signature"];
  const timestamp = req.headers["x-webhook-timestamp"];
  const rawBody   = JSON.stringify(req.body);
  if (signature && timestamp) {
    const signedPayload = `${timestamp}${rawBody}`;
    const expectedSig   = crypto.createHmac("sha256", process.env.CASHFREE_SECRET_KEY).update(signedPayload).digest("base64");
    if (signature !== expectedSig) return res.status(400).json({ message: "Invalid webhook signature." });
  }
  const { type, data } = req.body;
  if (type === "PAYMENT_SUCCESS_WEBHOOK") {
    const cashfreeOrderId = data?.order?.order_id;
    if (cashfreeOrderId) {
      const order = await Order.findOne({ "paymentDetails.cashfreeOrderId": cashfreeOrderId });
      if (order && order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.paymentDetails.paidAt = new Date();
        order.paymentDetails.cashfreePaymentId = data?.payment?.cf_payment_id || "";
        order.orderStatus = "confirmed";
        order.statusHistory.push({ status:"confirmed", message:"Payment confirmed via webhook." });
        await order.save();
        await Transaction.findOneAndUpdate({ cashfreeOrderId }, { status:"success", gatewayResponse:data });
        await Cart.findOneAndUpdate({ user:order.user }, { items:[], couponCode:"", couponDiscount:0 });
      }
    }
  }
  res.status(200).json({ received: true });
});

const getTransaction = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) { res.status(404); throw new Error("Order not found."); }
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") { res.status(403); throw new Error("Not authorized."); }
  const transaction = await Transaction.findOne({ order: req.params.orderId });
  res.status(200).json({ success: true, transaction });
});

module.exports = { initiatePayment, verifyPayment, webhookHandler, getTransaction };
