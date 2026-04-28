// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("decorlix_user");
    const token  = localStorage.getItem("decorlix_token");
    if (stored && token) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("decorlix_token", token);
    localStorage.setItem("decorlix_user",  JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("decorlix_token");
    localStorage.removeItem("decorlix_user");
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get("/auth/me");
      localStorage.setItem("decorlix_user", JSON.stringify(data.user));
      setUser(data.user);
    } catch (_) { logout(); }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
