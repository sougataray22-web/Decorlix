// backend/controllers/orderController.js
const asyncHandler = require("express-async-handler");
const Order   = require("../models/orderModel");
const Product = require("../models/productModel");

const calculatePricing = (items) => {
  const itemsPrice   = items.reduce((sum, item) => {
    const unitPrice = item.discountPrice > 0 ? item.discountPrice : item.price;
    return sum + unitPrice * item.quantity;
  }, 0);
  const shippingPrice = itemsPrice >= 999 ? 0 : 49;
  const taxPrice = 0;
  const totalPrice = Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100;
  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
};

const validateAndReserveStock = async (items) => {
  const errors = []; const updates = [];
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) { errors.push(`Product "${item.name}" is no longer available.`); continue; }
    if (product.stock < item.quantity) { errors.push(`Only ${product.stock} unit(s) of "${product.name}" in stock.`); continue; }
    updates.push({ product, quantity: item.quantity });
  }
  if (errors.length > 0) return { success: false, errors };
  for (const { product, quantity } of updates) { product.stock -= quantity; product.sold += quantity; await product.save(); }
  return { success: true };
};

const restoreStock = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity, sold: -item.quantity } });
  }
};

const placeOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode } = req.body;
  if (!items || items.length === 0) { res.status(400); throw new Error("Order must have at least one item."); }
  if (!shippingAddress) { res.status(400); throw new Error("Shipping address is required."); }
  const { fullName, phone, addressLine1, city, state, pincode } = shippingAddress;
  if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) { res.status(400); throw new Error("Please provide complete shipping address."); }
  if (!paymentMethod) { res.status(400); throw new Error("Payment method is required."); }
  const enrichedItems = [];
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) { res.status(400); throw new Error(`Product not found: ${item.product}`); }
    enrichedItems.push({ product: product._id, name: product.name, image: product.images?.[0]?.url || "",
      price: product.price, discountPrice: product.discountPrice || 0, quantity: item.quantity, sku: product.sku || "" });
  }
  const stockResult = await validateAndReserveStock(enrichedItems);
  if (!stockResult.success) { res.status(400); throw new Error(stockResult.errors.join(" | ")); }
  const { itemsPrice, shippingPrice, taxPrice, totalPrice } = calculatePricing(enrichedItems);
  const order = await Order.create({
    user: req.user._id, items: enrichedItems, shippingAddress,
    itemsPrice, shippingPrice, taxPrice, totalPrice, paymentMethod,
    couponCode: couponCode || "", orderStatus: "placed",
    statusHistory: [{ status: "placed", message: "Order placed successfully.", updatedBy: req.user._id }],
  });
  res.status(201).json({ success: true, message: "Order placed successfully.", order });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.orderStatus = status;
  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, parseInt(limit));
  const skip     = (pageNum - 1) * limitNum;
  const [orders, totalCount] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).select("-statusHistory -adminNotes"),
    Order.countDocuments(filter),
  ]);
  res.status(200).json({ success: true, totalCount, totalPages: Math.ceil(totalCount / limitNum), currentPage: pageNum, orders });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email phone").populate("items.product", "name images slug");
  if (!order) { res.status(404); throw new Error("Order not found."); }
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") { res.status(403); throw new Error("Not authorized."); }
  res.status(200).json({ success: true, order });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error("Order not found."); }
  if (order.user.toString() !== req.user._id.toString()) { res.status(403); throw new Error("Not authorized."); }
  if (!["placed","confirmed","processing"].includes(order.orderStatus)) { res.status(400); throw new Error(`Cannot cancel. Status: ${order.orderStatus}`); }
  await restoreStock(order.items);
  order.orderStatus  = "cancelled";
  order.cancelReason = reason || "Cancelled by customer";
  order.statusHistory.push({ status: "cancelled", message: reason || "Cancelled by customer", updatedBy: req.user._id });
  await order.save();
  res.status(200).json({ success: true, message: "Order cancelled.", order });
});

const requestReturn = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) { res.status(400); throw new Error("Return reason is required."); }
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error("Order not found."); }
  if (order.user.toString() !== req.user._id.toString()) { res.status(403); throw new Error("Not authorized."); }
  if (order.orderStatus !== "delivered") { res.status(400); throw new Error("Only delivered orders can be returned."); }
  order.orderStatus  = "return_requested";
  order.returnReason = reason;
  order.statusHistory.push({ status: "return_requested", message: `Return: ${reason}`, updatedBy: req.user._id });
  await order.save();
  res.status(200).json({ success: true, message: "Return request submitted.", order });
});

const adminGetAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, paymentStatus, keyword, from, to, sort = "newest" } = req.query;
  const filter = {};
  if (status)        filter.orderStatus   = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (from || to) { filter.createdAt = {}; if (from) filter.createdAt.$gte = new Date(from); if (to) filter.createdAt.$lte = new Date(to); }
  if (keyword) filter.$or = [{ orderNumber: { $regex: keyword.trim(), $options: "i" } }];
  const sortObj = sort === "oldest" ? { createdAt: 1 } : sort === "amount_asc" ? { totalPrice: 1 } : sort === "amount_desc" ? { totalPrice: -1 } : { createdAt: -1 };
  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const skip     = (pageNum - 1) * limitNum;
  const [orders, totalCount] = await Promise.all([
    Order.find(filter).populate("user", "name email phone").sort(sortObj).skip(skip).limit(limitNum).select("-statusHistory"),
    Order.countDocuments(filter),
  ]);
  res.status(200).json({ success: true, totalCount, totalPages: Math.ceil(totalCount / limitNum), currentPage: pageNum, orders });
});

const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, trackingNumber, shippingCarrier, estimatedDelivery, adminNotes, message } = req.body;
  const validStatuses = ["placed","confirmed","processing","shipped","out_for_delivery","delivered","cancelled","return_requested","returned","refunded"];
  if (!orderStatus || !validStatuses.includes(orderStatus)) { res.status(400); throw new Error(`Invalid status.`); }
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error("Order not found."); }
  if (orderStatus === "delivered") { order.deliveredAt = new Date(); order.paymentStatus = "paid"; order.paymentDetails.paidAt = new Date(); }
  if (orderStatus === "cancelled" && order.orderStatus !== "cancelled") await restoreStock(order.items);
  if (orderStatus === "refunded") order.paymentStatus = "refunded";
  order.orderStatus = orderStatus;
  if (trackingNumber)    order.trackingNumber    = trackingNumber;
  if (shippingCarrier)   order.shippingCarrier   = shippingCarrier;
  if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
  if (adminNotes)        order.adminNotes        = adminNotes;
  order.statusHistory.push({ status: orderStatus, message: message || `Updated to ${orderStatus}`, updatedBy: req.user._id });
  await order.save();
  res.status(200).json({ success: true, message: `Order status updated to "${orderStatus}".`, order });
});

const adminUpdatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus, cashfreePaymentId, bankRef } = req.body;
  if (!["pending","paid","failed","refunded"].includes(paymentStatus)) { res.status(400); throw new Error("Invalid payment status."); }
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error("Order not found."); }
  order.paymentStatus = paymentStatus;
  if (paymentStatus === "paid") order.paymentDetails.paidAt = new Date();
  if (cashfreePaymentId) order.paymentDetails.cashfreePaymentId = cashfreePaymentId;
  if (bankRef) order.paymentDetails.bankRef = bankRef;
  await order.save();
  res.status(200).json({ success: true, message: `Payment status updated to "${paymentStatus}".`, order });
});

module.exports = { placeOrder, getMyOrders, getOrderById, cancelOrder, requestReturn,
  adminGetAllOrders, adminUpdateOrderStatus, adminUpdatePaymentStatus };
