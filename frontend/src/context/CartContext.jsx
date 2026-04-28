// frontend/src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user }  = useAuth();
  const [cart,        setCart]        = useState(null);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    if (user) fetchCart();
    else      setCart(null);
  }, [user]);

  const fetchCart = async () => {
    try {
      setCartLoading(true);
      const { data } = await api.get("/cart");
      setCart(data.cart);
    } catch (_) {}
    finally { setCartLoading(false); }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!user) { toast.error("Please login to add items to cart"); return false; }
    try {
      const { data } = await api.post("/cart", { productId, quantity });
      setCart(data.cart);
      toast.success("Added to cart!");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
      return false;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const { data } = await api.put(`/cart/${productId}`, { quantity });
      setCart(data.cart);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const removeItem = async (productId) => {
    try {
      const { data } = await api.delete(`/cart/${productId}`);
      setCart(data.cart);
      toast.success("Item removed");
    } catch (_) { toast.error("Remove failed"); }
  };

  const clearCart = async () => {
    try {
      await api.delete("/cart");
      setCart(null);
    } catch (_) {}
  };

  const cartCount = cart?.totalItems || 0;

  return (
    <CartContext.Provider value={{
      cart, cartLoading, cartCount,
      fetchCart, addToCart, updateQuantity, removeItem, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
