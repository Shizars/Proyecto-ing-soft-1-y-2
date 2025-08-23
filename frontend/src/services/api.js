import axios from "axios";

//api.js
const api = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
});

/* -------- request: añade token -------- */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* -------- response: captura 401 -------- */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";          // redirige a login
    }
    return Promise.reject(err);
  }
);


export const setTags = (docId, tags) =>
  api.post(`/documents/${docId}/tags`, { tags });

export const removeTag = (docId, tagId) =>
  api.delete(`/documents/${docId}/tags/${tagId}`);

/* -------- Auditorías -------- */
export const createAudit = (data) => api.post("/audits", data);
export const getAudits = () => api.get("/audits");



export default api;

