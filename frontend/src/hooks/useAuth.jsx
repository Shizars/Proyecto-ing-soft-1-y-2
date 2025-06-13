import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutTimer = useRef(null); // ⬅️ nuevo

  /* ---------- helpers ---------- */
  // decodifica JWT (sin lib externa) y devuelve { exp } en segundos
  const getTokenExp = (jwt) => {
    try {
      const payload = JSON.parse(atob(jwt.split(".")[1]));
      return payload.exp; // epoch seg
    } catch {
      return null;
    }
  };

  const scheduleLogout = (token) => {
    if (!token) return;
    const exp = getTokenExp(token);
    if (!exp) return;

    const msRemaining = exp * 1000 - Date.now();
    if (msRemaining <= 0) {
      logout();
    } else {
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      logoutTimer.current = setTimeout(logout, msRemaining);
    }
  };

  /* ---------- bootstrap ---------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    setIsAuthenticated(!!token);
    if (storedUser) setUser(JSON.parse(storedUser));

    scheduleLogout(token); // ⬅️ programa auto-logout
    setLoading(false);
  }, []);

  /* ---------- login / logout ---------- */
  const login = async (email, password) => {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      email,
      password,
    });
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    setIsAuthenticated(true);
    scheduleLogout(token); // ⬅️ también al iniciar sesión
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    setUser(null);
    setIsAuthenticated(false);
    window.location.replace("/");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
