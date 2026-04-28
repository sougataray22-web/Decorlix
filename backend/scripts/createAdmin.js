// backend/scripts/createAdmin.js
const mongoose = require("mongoose");
const dotenv   = require("dotenv");
dotenv.config({ path: "../.env" });
const User = require("../models/userModel");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const adminData = { name:"Decorlix Admin", email:"admin@decorlix.com", password:"Admin@12345", role:"admin", isVerified:true };
    const existing = await User.findOne({ email: adminData.email });
    if (existing) { console.log("⚠️  Admin already exists:", adminData.email); process.exit(0); }
    const admin = await User.create(adminData);
    console.log("✅ Admin created:", admin.email);
    process.exit(0);
  } catch (err) { console.error("❌ Error:", err.message); process.exit(1); }
};
createAdmin();
