// backend/scripts/createAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/userModel");

console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Found" : "❌ NOT FOUND");

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing! Check your .env file");
  process.exit(1);
}

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const adminData = {
      name: "Decorlix Admin",
      email: "admin@decorlix.com",
      password: "Admin@12345",
      role: "admin",
      isVerified: true,
    };

    await User.deleteOne({ email: adminData.email });
    console.log("🗑️  Old admin removed");

    const admin = await User.create(adminData);
    console.log("✅ Admin created!");
    console.log("📧 Email:    " + admin.email);
    console.log("🔑 Password: Admin@12345");
    console.log("👤 Role:     " + admin.role);

    await mongoose.disconnect();
    console.log("✅ Done");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

createAdmin();