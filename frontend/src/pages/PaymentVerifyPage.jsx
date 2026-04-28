// frontend/src/pages/PaymentVerifyPage.jsx
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../services/api";

export default function PaymentVerifyPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [order,  setOrder]  = useState(null);

  const orderId         = searchParams.get("orderId");
  const cashfreeOrderId = searchParams.get("cashfreeOrderId");

  useEffect(() => {
    if (!orderId || !cashfreeOrderId) { setStatus("error"); return; }
    api.post("/payments/verify", { orderId, cashfreeOrderId })
      .then(({ data }) => { setOrder(data.order); setStatus(data.paid ? "success" : "failed"); })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-lg">

        {status === "verifying" && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-700">Verifying Payment...</h2>
            <p className="text-gray-500 mt-2 text-sm">Please do not close this window</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-1">Your order has been confirmed.</p>
            {order && (
              <p className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg px-4 py-2 mt-3">
                Order # {order.orderNumber}
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <Link to={`/orders/${orderId}`}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700">
                Track Order
              </Link>
              <Link to="/"
                className="flex-1 border border-gray-300 py-2.5 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">
                Home
              </Link>
            </div>
          </>
        )}

        {(status === "failed" || status === "error") && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-500 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">Your payment was not completed. No money has been deducted.</p>
            <div className="flex gap-3">
              <Link to="/checkout"
                className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700">
                Try Again
              </Link>
              <Link to="/orders"
                className="flex-1 border border-gray-300 py-2.5 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">
                My Orders
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
