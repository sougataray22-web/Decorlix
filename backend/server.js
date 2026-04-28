// backend/server.js — COMPLETE FINAL VERSION
const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");
const dotenv     = require("dotenv");

dotenv.config();

const connectDB             = require("./config/db");
const initFirebase          = require("./config/firebase");
const { connectCloudinary } = require("./config/cloudinary");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const healthRoute   = require("./routes/healthRoute");
const authRoutes    = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes   = require("./routes/orderRoutes");
const adminRoutes   = require("./routes/adminRoutes");
const uploadRoutes  = require("./routes/uploadRoutes");
const cartRoutes    = require("./routes/cartRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// ── Connections ────────────────────────────────────────────────────────────────
connectDB();
initFirebase();
connectCloudinary();

const app = express();

// ── Security ───────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "http://localhost:3001",
      "https://decorlix-frontend.vercel.app",
      "https://www.decorlix.co.in",
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
}));

// Raw body needed for Cashfree webhook signature verification
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const authLimiter   = rateLimit({ windowMs: 15*60*1000, max: 20, message: { success:false, message:"Too many auth attempts." } });
const globalLimiter = rateLimit({ windowMs: 15*60*1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use("/api",      globalLimiter);
app.use("/api/auth", authLimiter);

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/health",   healthRoute);
app.use("/api/auth",     authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders",   orderRoutes);
app.use("/api/admin",    adminRoutes);
app.use("/api/upload",   uploadRoutes);
app.use("/api/cart",     cartRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => res.json({ success: true, message: "Decorlix API 🛍️" }));

// ── Error Handlers (must be last) ──────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║    🛍️  Decorlix Backend Server           ║
  ║    Mode: ${process.env.NODE_ENV || "development"}                     ║
  ║    URL:  http://localhost:${PORT}           ║
  ╚══════════════════════════════════════════╝
  `);
});

process.on("unhandledRejection", (err) => {
  console.error(`💥 Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

module.exports = app;
