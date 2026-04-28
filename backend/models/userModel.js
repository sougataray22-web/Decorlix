// backend/models/userModel.js
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String, required: [true, "Name is required"],
      trim: true, minlength: 2, maxlength: 50,
    },
    email: {
      type: String, unique: true, sparse: true,
      lowercase: true, trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Invalid email"],
    },
    phone: {
      type: String, unique: true, sparse: true, trim: true,
      match: [/^[6-9]\d{9}$/, "Invalid 10-digit Indian mobile number"],
    },
    password: { type: String, minlength: 6, select: false },
    role:     { type: String, enum: ["user","admin"], default: "user" },
    avatar:   { type: String, default: "" },
    isVerified:  { type: Boolean, default: false },
    firebaseUid: { type: String, unique: true, sparse: true },
    addresses: [
      {
        label:        { type: String, default: "Home" },
        fullName:     { type: String, required: true },
        phone:        { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String, default: "" },
        city:         { type: String, required: true },
        state:        { type: String, required: true },
        pincode:      { type: String, required: true },
        isDefault:    { type: Boolean, default: false },
      },
    ],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    resetPasswordToken:  String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.__v;
  return obj;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
