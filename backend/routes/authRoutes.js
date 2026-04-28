// backend/routes/authRoutes.js
const express = require("express");
const router  = express.Router();
const { registerUser, loginUser, getMe, updateProfile, changePassword, firebaseLogin, adminLogin } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register",         registerUser);
router.post("/login",            loginUser);
router.post("/firebase-login",   firebaseLogin);
router.post("/admin-login",      adminLogin);
router.get("/me",                protect, getMe);
router.put("/profile",           protect, updateProfile);
router.put("/change-password",   protect, changePassword);

module.exports = router;
