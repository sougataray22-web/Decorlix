// backend/config/cashfree.js
const axios = require("axios");

const CASHFREE_BASE_URL =
  process.env.CASHFREE_ENV === "PROD"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const cashfreeHeaders = {
  "x-api-version":   "2023-08-01",
  "x-client-id":     process.env.CASHFREE_APP_ID,
  "x-client-secret": process.env.CASHFREE_SECRET_KEY,
  "Content-Type":    "application/json",
};

const createCashfreeOrder = async ({
  orderId, orderAmount, customerName, customerEmail, customerPhone, returnUrl,
}) => {
  const response = await axios.post(
    `${CASHFREE_BASE_URL}/orders`,
    {
      order_id:       orderId,
      order_amount:   orderAmount,
      order_currency: "INR",
      customer_details: {
        customer_id:    `cust_${Date.now()}`,
        customer_name:  customerName,
        customer_email: customerEmail || "no-reply@decorlix.com",
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
      },
    },
    { headers: cashfreeHeaders }
  );
  return response.data;
};

const verifyCashfreePayment = async (cashfreeOrderId) => {
  const response = await axios.get(
    `${CASHFREE_BASE_URL}/orders/${cashfreeOrderId}`,
    { headers: cashfreeHeaders }
  );
  return response.data;
};

const getCashfreePayments = async (cashfreeOrderId) => {
  const response = await axios.get(
    `${CASHFREE_BASE_URL}/orders/${cashfreeOrderId}/payments`,
    { headers: cashfreeHeaders }
  );
  return response.data;
};

module.exports = { createCashfreeOrder, verifyCashfreePayment, getCashfreePayments };
