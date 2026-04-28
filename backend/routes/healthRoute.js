// backend/routes/healthRoute.js
const express  = require("express");
const router   = express.Router();
const mongoose = require("mongoose");
router.get("/", (req, res) => {
  const dbState  = mongoose.connection.readyState;
  const dbStatus = dbState===1?"connected":dbState===2?"connecting":"disconnected";
  res.status(200).json({ success:true, message:"Decorlix API is running 🚀", environment:process.env.NODE_ENV, database:dbStatus, timestamp:new Date().toISOString() });
});
module.exports = router;
