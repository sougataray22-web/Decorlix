// backend/models/orderModel.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product:       { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name:          { type: String, required: true },
  image:         { type: String, default: "" },
  price:         { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  quantity:      { type: Number, required: true, min: 1 },
  sku:           { type: String, default: "" },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName:     { type: String, required: true },
  phone:        { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: "" },
  city:         { type: String, required: true },
  state:        { type: String, required: true },
  pincode:      { type: String, required: true },
  country:      { type: String, default: "India" },
});

const statusHistorySchema = new mongoose.Schema({
  status:    { type: String, required: true },
  message:   { type: String, default: "" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  timestamp: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items:       [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    itemsPrice:     { type: Number, required: true, default: 0 },
    shippingPrice:  { type: Number, required: true, default: 0 },
    taxPrice:       { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalPrice:     { type: Number, required: true, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["cashfree","cod","upi","card","netbanking","wallet"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending","paid","failed","refunded","partially_refunded"],
      default: "pending",
    },
    paymentDetails: {
      cashfreeOrderId:   { type: String, default: "" },
      cashfreePaymentId: { type: String, default: "" },
      paidAt:            { type: Date },
      method:            { type: String, default: "" },
      bankRef:           { type: String, default: "" },
    },
    orderStatus: {
      type: String,
      enum: ["placed","confirmed","processing","shipped","out_for_delivery",
             "delivered","cancelled","return_requested","returned","refunded"],
      default: "placed",
    },
    statusHistory:     [statusHistorySchema],
    trackingNumber:    { type: String, default: "" },
    shippingCarrier:   { type: String, default: "" },
    estimatedDelivery: { type: Date },
    deliveredAt:       { type: Date },
    couponCode:        { type: String, default: "" },
    couponDiscount:    { type: Number, default: 0 },
    cancelReason:      { type: String, default: "" },
    returnReason:      { type: String, default: "" },
    adminNotes:        { type: String, default: "" },
    invoiceNumber:     { type: String, default: "" },
  },
  { timestamps: true }
);

orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const date    = new Date();
    const dateStr = date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0");
    const start = new Date(date.setHours(0, 0, 0, 0));
    const end   = new Date(date.setHours(23, 59, 59, 999));
    const count = await this.constructor.countDocuments({ createdAt: { $gte: start, $lte: end } });
    this.orderNumber = `DEC-${dateStr}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
