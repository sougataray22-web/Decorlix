// backend/models/productModel.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name:    { type: String, required: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true, trim: true, maxlength: 200 },
    slug:             { type: String, unique: true, lowercase: true, trim: true },
    description:      { type: String, required: true, maxlength: 2000 },
    shortDescription: { type: String, default: "", maxlength: 300 },
    price:            { type: Number, required: true, min: 0 },
    discountPrice:    { type: Number, default: 0, min: 0 },
    discountPercent:  { type: Number, default: 0 },
    category:         { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    brand:            { type: String, trim: true, default: "" },
    images: [
      {
        url:      { type: String, required: true },
        publicId: { type: String, default: "" },
        alt:      { type: String, default: "" },
      },
    ],
    specifications: [
      { key: { type: String, required: true }, value: { type: String, required: true } },
    ],
    stock:      { type: Number, required: true, min: 0, default: 0 },
    sold:       { type: Number, default: 0 },
    sku:        { type: String, unique: true, sparse: true, trim: true },
    tags:       [{ type: String, trim: true, lowercase: true }],
    reviews:    [reviewSchema],
    rating:     { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },
    weight:     { type: Number, default: 0 },
    dimensions: {
      length: { type: Number, default: 0 },
      width:  { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Date.now();
  }
  if (this.price > 0 && this.discountPrice > 0) {
    this.discountPercent = Math.round(((this.price - this.discountPrice) / this.price) * 100);
  } else {
    this.discountPercent = 0;
  }
  next();
});

productSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0; this.numReviews = 0;
  } else {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.rating = Math.round((total / this.reviews.length) * 10) / 10;
    this.numReviews = this.reviews.length;
  }
};

productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isActive: 1 });

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
