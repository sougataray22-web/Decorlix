// frontend/src/components/TawkToChat.jsx
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function TawkToChat() {
  const { user } = useAuth();

  useEffect(() => {
    // Don't load if property ID is missing
    const propertyId = process.env.REACT_APP_TAWKTO_PROPERTY_ID;
    const widgetId   = process.env.REACT_APP_TAWKTO_WIDGET_ID;
    if (!propertyId || propertyId === "your_tawkto_property_id") return;

    window.Tawk_API  = window.Tawk_API  || {};
    window.Tawk_LoadStart = new Date();

    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src   = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");
    s0.parentNode.insertBefore(s1, s0);

    return () => {
      try { if (window.Tawk_API) window.Tawk_API.hideWidget(); } catch (_) {}
    };
  }, []);

  // Pass user info to Tawk.to when user logs in
  useEffect(() => {
    if (user && window.Tawk_API?.setAttributes) {
      window.Tawk_API.onLoad = () => {
        window.Tawk_API.setAttributes({
          name:  user.name,
          email: user.email || `${user.phone}@phone.decorlix.com`,
          id:    user._id,
        }, () => {});
      };
    }
  }, [user]);

  return null;
}
