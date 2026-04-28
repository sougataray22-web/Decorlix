// backend/models/cartModel.js
const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product:       { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity:      { type: Number, required: true, min: 1, default: 1 },
  price:         { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  name:          { type: String, required: true },
  image:         { type: String, default: "" },
  sku:           { type: String, default: "" },
});

const cartSchema = new mongoose.Schema(
  {
    user:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items:          [cartItemSchema],
    couponCode:     { type: String, default: "" },
    couponDiscount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

cartSchema.virtual("itemsPrice").get(function () {
  return this.items.reduce((sum, item) => {
    const price = item.discountPrice > 0 ? item.discountPrice : item.price;
    return sum + price * item.quantity;
  }, 0);
});

cartSchema.virtual("totalItems").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.set("toJSON",   { virtuals: true });
cartSchema.set("toObject", { virtuals: true });

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
