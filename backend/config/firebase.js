// backend/config/firebase.js
const admin = require("firebase-admin");

const initFirebase = () => {
  if (admin.apps.length > 0) return admin;
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
          : undefined,
      }),
    });
    console.log("✅ Firebase Admin SDK initialized");
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error.message);
    process.exit(1);
  }
  return admin;
};

module.exports = initFirebase;
