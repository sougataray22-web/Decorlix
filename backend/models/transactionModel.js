// backend/models/transactionModel.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    order:             { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    user:              { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
    cashfreeOrderId:   { type: String, required: true, unique: true },
    cashfreePaymentId: { type: String, default: "" },
    amount:            { type: Number, required: true },
    currency:          { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["initiated","success","failed","pending","refunded"],
      default: "initiated",
    },
    paymentMethod:   { type: String, default: "" },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
    refundId:        { type: String, default: "" },
    refundAmount:    { type: Number, default: 0 },
    refundedAt:      { type: Date },
  },
  { timestamps: true }
);

transactionSchema.index({ cashfreeOrderId: 1 });
transactionSchema.index({ order: 1 });
transactionSchema.index({ user: 1 });
transactionSchema.index({ status: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
