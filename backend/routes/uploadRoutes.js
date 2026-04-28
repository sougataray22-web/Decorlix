// backend/routes/uploadRoutes.js
const express      = require("express");
const router       = express.Router();
const asyncHandler = require("express-async-handler");
const { cloudinary } = require("../config/cloudinary");
const upload       = require("../middleware/uploadMiddleware");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const streamifier  = require("streamifier");

const uploadToCloudinary = (buffer, folder, filename) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: filename, transformation: [{ width:1000, height:1000, crop:"limit", quality:"auto" }] },
      (error, result) => { if (error) return reject(error); resolve(result); }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

router.post("/product-images", protect, adminOnly, upload.array("images", 5), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) { res.status(400); throw new Error("Please upload at least one image."); }
  const uploadedImages = await Promise.all(req.files.map(async (file, idx) => {
    const result = await uploadToCloudinary(file.buffer, "decorlix/products", `product_${Date.now()}_${idx}`);
    return { url: result.secure_url, publicId: result.public_id, alt: file.originalname };
  }));
  res.status(200).json({ success: true, message: `${uploadedImages.length} image(s) uploaded.`, images: uploadedImages });
}));

router.post("/avatar", protect, upload.single("avatar"), asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error("Please upload an image."); }
  const result = await uploadToCloudinary(req.file.buffer, "decorlix/avatars", `avatar_${req.user._id}_${Date.now()}`);
  const User   = require("../models/userModel");
  await User.findByIdAndUpdate(req.user._id, { avatar: result.secure_url });
  res.status(200).json({ success: true, avatarUrl: result.secure_url, publicId: result.public_id });
}));

router.delete("/product-images", protect, adminOnly, asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) { res.status(400); throw new Error("publicId is required."); }
  const result = await cloudinary.uploader.destroy(publicId);
  if (result.result !== "ok") { res.status(400); throw new Error("Failed to delete image."); }
  res.status(200).json({ success: true, message: "Image deleted." });
}));

module.exports = router;
