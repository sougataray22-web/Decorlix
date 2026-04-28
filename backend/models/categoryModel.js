// backend/models/categoryModel.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true, unique: true, maxlength: 50 },
    slug:     { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "", maxlength: 200 },
    image:    { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    parent:   { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
  },
  { timestamps: true }
);

categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  next();
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
