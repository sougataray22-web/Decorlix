// backend/controllers/authController.js
const asyncHandler  = require("express-async-handler");
const User          = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const initFirebase  = require("../config/firebase");

const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true, 
    message, 
    token,
    user: {
      _id: user._id, 
      name: user.name, 
      email: user.email,
      phone: user.phone, 
      role: user.role, 
      avatar: user.avatar,
      isVerified: user.isVerified,
    },
  });
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  
  if (!phone || phone.length < 10) {
    res.status(400);
    throw new Error("Phone number is required (10 digits).");
  }
  
  if (!name || !password) {
    res.status(400);
    throw new Error("Name and password are required.");
  }
  
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters.");
  }

  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    res.status(409);
    throw new Error("Phone number already registered.");
  }

  if (email) {
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      res.status(409);
      throw new Error("Email already registered.");
    }
  }

  const user = await User.create({
    name: name.trim(),
    email: email ? email.toLowerCase().trim() : null,
    password,
    phone,
    isVerified: true,
  });

  sendTokenResponse(user, 201, res, "Account created successfully.");
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, phone } = req.body;

  if (!email && !phone) {
    res.status(400);
    throw new Error("Please provide email or phone number and password.");
  }

  if (!password) {
    res.status(400);
    throw new Error("Password is required.");
  }

  const user = await User.findOne({
    $or: [
      email ? { email: email.toLowerCase() } : null,
      phone ? { phone } : null,
    ].filter(Boolean),
  }).select("+password");

  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials.");
  }

  if (!user.password) {
    res.status(400);
    throw new Error("This account uses phone OTP login. Please use OTP instead.");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid credentials.");
  }

  sendTokenResponse(user, 200, res, "Logged in successfully.");
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }
  res.status(200).json({ success: true, user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }
  const { name, avatar } = req.body;
  if (name)   user.name   = name.trim();
  if (avatar) user.avatar = avatar;
  const updatedUser = await user.save();
  sendTokenResponse(updatedUser, 200, res, "Profile updated successfully.");
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Please provide current and new password.");
  }
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters.");
  }
  const user = await User.findById(req.user._id).select("+password");
  if (!user.password) {
    res.status(400);
    throw new Error("This account uses phone login.");
  }
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error("Current password is incorrect.");
  }
  user.password = newPassword;
  await user.save();
  res.status(200).json({ success: true, message: "Password changed successfully." });
});

const firebaseLogin = asyncHandler(async (req, res) => {
  const { idToken, name } = req.body;
  if (!idToken) {
    res.status(400);
    throw new Error("Firebase ID token is required.");
  }
  const admin = initFirebase();
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired OTP. Please try again.");
  }
  const { uid, phone_number } = decodedToken;
  if (!phone_number) {
    res.status(400);
    throw new Error("Phone number not found in token.");
  }
  const phone10 = phone_number.replace(/^\+91/, "");
  let user = await User.findOne({ $or: [{ firebaseUid: uid }, { phone: phone10 }] });
  if (user) {
    if (!user.firebaseUid) { user.firebaseUid = uid; await user.save(); }
    return sendTokenResponse(user, 200, res, "Logged in successfully.");
  }
  const newUser = await User.create({
    name: name ? name.trim() : `User${phone10.slice(-4)}`,
    phone: phone10, 
    firebaseUid: uid, 
    isVerified: true, 
    role: "user",
  });
  sendTokenResponse(newUser, 201, res, "Account created successfully.");
});

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password.");
  }
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || user.role !== "admin") {
    res.status(401);
    throw new Error("Invalid credentials or insufficient permissions.");
  }
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid credentials.");
  }
  sendTokenResponse(user, 200, res, "Admin login successful.");
});

module.exports = { 
  registerUser, 
  loginUser, 
  getMe, 
  updateProfile, 
  changePassword, 
  firebaseLogin, 
  adminLogin 
};