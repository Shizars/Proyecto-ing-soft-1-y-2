import axios from "axios";

// URL base del backend
const api = axios.create({
  baseURL: "http://127.0.0.1:5000/api",   // ⬅️ cambia si usas otro host
});

// Interceptor: añade el token en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
