# 🛍️ Decorlix — Full-Stack E-Commerce Website

A production-ready e-commerce platform built with React.js, Node.js, MongoDB, Firebase OTP, Cashfree payments, and Tawk.to live chat.

---

## 📁 Project Structure

```
decorlix/
├── backend/               ← Node.js + Express API
│   ├── config/            ← DB, Firebase, Cloudinary, Cashfree
│   ├── controllers/       ← Business logic
│   ├── middleware/        ← Auth, upload, error handlers
│   ├── models/            ← Mongoose schemas
│   ├── routes/            ← API routes
│   ├── scripts/           ← Seed scripts
│   ├── utils/             ← JWT generator
│   ├── .env               ← ⚠️ Fill this with your credentials
│   └── server.js          ← Entry point
│
└── frontend/              ← React.js app
    ├── public/            ← index.html
    ├── src/
    │   ├── components/    ← Navbar, Footer, ProductCard, etc.
    │   ├── config/        ← Firebase config
    │   ├── context/       ← AuthContext, CartContext
    │   ├── pages/         ← All pages
    │   └── services/      ← Axios API instance
    ├── .env               ← ⚠️ Fill this with your credentials
    └── tailwind.config.js
```

---

## ⚙️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React.js 18, Tailwind CSS           |
| Backend     | Node.js, Express.js                 |
| Database    | MongoDB Atlas (Mongoose)            |
| Auth        | JWT + Firebase Phone OTP            |
| Payments    | Cashfree Payment Gateway            |
| Images      | Cloudinary                          |
| Live Chat   | Tawk.to (free)                      |
| Deployment  | Vercel (frontend) + Render (backend)|

---

## 🚀 Quick Start

### Step 1 — Backend Setup

```bash
cd backend
npm install
```

Fill in `backend/.env` with all credentials (see below).

```bash
# Create admin user (run once)
node scripts/createAdmin.js

# Seed categories (run once)
node scripts/seedCategories.js

# Start development server
npm run dev
```

Backend runs at: **http://localhost:5000**

Test: `curl http://localhost:5000/api/health`

---

### Step 2 — Frontend Setup

```bash
cd frontend
npm install
```

Fill in `frontend/.env` with Firebase + Tawk.to credentials.

```bash
npm start
```

Frontend runs at: **http://localhost:3000**

---

## 🔐 Environment Variables

### `backend/.env`

| Variable | Where to get |
|---|---|
| `MONGO_URI` | [MongoDB Atlas](https://cloud.mongodb.com) → Connect → Connection String |
| `JWT_SECRET` | Any random 32+ character string |
| `CLOUDINARY_*` | [Cloudinary Console](https://cloudinary.com) → Dashboard |
| `CASHFREE_APP_ID` | [Cashfree Dashboard](https://merchant.cashfree.com) → Credentials |
| `CASHFREE_SECRET_KEY` | Same as above |
| `FIREBASE_PROJECT_ID` | Firebase Console → Project Settings |
| `FIREBASE_CLIENT_EMAIL` | Firebase Console → Service Accounts → Generate Key |
| `FIREBASE_PRIVATE_KEY` | Same JSON file (copy entire private_key value) |

### `frontend/.env`

| Variable | Where to get |
|---|---|
| `REACT_APP_FIREBASE_API_KEY` | Firebase Console → Project Settings → Web App |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Same as above |
| `REACT_APP_FIREBASE_PROJECT_ID` | Same as above |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Same as above |
| `REACT_APP_FIREBASE_APP_ID` | Same as above |
| `REACT_APP_TAWKTO_PROPERTY_ID` | [Tawk.to Dashboard](https://dashboard.tawk.to) → Administration → Chat Widget |
| `REACT_APP_TAWKTO_WIDGET_ID` | Same as above |

---

## 📋 API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/firebase-login` | Public |
| POST | `/api/auth/admin-login` | Public |
| GET | `/api/auth/me` | Private |
| PUT | `/api/auth/profile` | Private |
| PUT | `/api/auth/change-password` | Private |

### Products
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/products` | Public |
| GET | `/api/products/:id` | Public |
| GET | `/api/products/featured` | Public |
| GET | `/api/products/search-suggestions?q=` | Public |
| POST | `/api/products` | Admin |
| PUT | `/api/products/:id` | Admin |
| DELETE | `/api/products/:id` | Admin |
| POST | `/api/products/:id/reviews` | Private |

### Cart
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/cart` | Private |
| POST | `/api/cart` | Private |
| PUT | `/api/cart/:productId` | Private |
| DELETE | `/api/cart/:productId` | Private |
| DELETE | `/api/cart` | Private |

### Orders
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/orders` | Private |
| GET | `/api/orders/my-orders` | Private |
| GET | `/api/orders/:id` | Private |
| PUT | `/api/orders/:id/cancel` | Private |
| GET | `/api/orders/admin/all` | Admin |
| PUT | `/api/orders/admin/:id/status` | Admin |

### Payments
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/payments/initiate` | Private |
| POST | `/api/payments/verify` | Private |
| POST | `/api/payments/webhook` | Public (Cashfree) |

### Admin
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/admin/dashboard` | Admin |
| GET | `/api/admin/users` | Admin |
| PUT | `/api/admin/users/:id/role` | Admin |
| DELETE | `/api/admin/users/:id` | Admin |
| GET | `/api/admin/inventory` | Admin |
| GET | `/api/admin/analytics/revenue` | Admin |

---

## 🌐 Frontend Pages

| Route | Page | Access |
|-------|------|--------|
| `/` | Home | Public |
| `/products` | Product Listing | Public |
| `/products/:id` | Product Detail | Public |
| `/login` | Login (Email + OTP) | Public |
| `/register` | Register | Public |
| `/cart` | Shopping Cart | Login |
| `/checkout` | Checkout | Login |
| `/payment/verify` | Payment Verification | Login |
| `/orders` | My Orders | Login |
| `/orders/:id` | Order Detail + Tracking | Login |
| `/profile` | My Profile | Login |
| `/admin` | Admin Dashboard | Admin |
| `/admin/products` | Product Management | Admin |
| `/admin/orders` | Order Management | Admin |
| `/admin/users` | User Management | Admin |

---

## 🚢 Deployment

### Backend → Render

1. Push `/backend` to GitHub
2. [render.com](https://render.com) → New Web Service → Connect repo
3. Build: `npm install` | Start: `node server.js`
4. Add all `.env` variables in Render's Environment tab
5. Copy your Render URL: `https://decorlix-backend.onrender.com`

### Frontend → Vercel

1. Push `/frontend` to GitHub
2. [vercel.com](https://vercel.com) → Import → Connect repo
3. Add all `REACT_APP_*` variables in Vercel's Environment Settings
4. Set `REACT_APP_API_URL=https://decorlix-backend.onrender.com/api`
5. Deploy → Copy your URL: `https://decorlix.vercel.app`

### Custom Domain (GoDaddy)

1. Vercel → Project → Settings → Domains → Add `decorlix.com`
2. GoDaddy DNS:
   - `A` record: `@` → `76.76.21.21`
   - `CNAME`: `www` → `cname.vercel-dns.com`
3. SSL is automatic (Let's Encrypt via Vercel)

---

## 🔑 Default Admin Credentials

```
Email:    admin@decorlix.com
Password: Admin@12345
```

⚠️ **Change these immediately after first login in production!**

---

## ✅ Features Checklist

- [x] Email + Password Authentication (JWT)
- [x] Phone OTP Login (Firebase + real SMS)
- [x] Admin Panel with role-based access
- [x] Product CRUD with image upload (Cloudinary)
- [x] Search with autocomplete
- [x] Filter by category, price, rating, brand
- [x] Sort by price, rating, popularity, discount
- [x] Shopping cart (add/update/remove)
- [x] Checkout with address form
- [x] Cashfree payment integration (online + COD)
- [x] Order tracking with status history
- [x] Order cancellation & return requests
- [x] Product reviews & ratings
- [x] Admin dashboard with revenue analytics
- [x] Low stock alerts
- [x] Inventory management
- [x] User management (role, delete)
- [x] Live chat (Tawk.to)
- [x] Responsive design (mobile + desktop)
- [x] Security: Helmet, CORS, Rate limiting, JWT

---

## 📞 Support

- Live Chat: Tawk.to widget (bottom-right of site)
- Email: support@decorlix.com
