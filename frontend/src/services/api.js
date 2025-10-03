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

export const deleteDocument = (docId) => api.delete(`/documents/${docId}`);

export const toggleFavorite = (docId) =>
  api.post(`/documents/${docId}/favorite/toggle`);

export const setFavorite = (docId, is_favorite) =>
  api.post(`/documents/${docId}/favorite`, { is_favorite });

export const listFavorites = () => api.get(`/documents/favorites`);

export const getComments = (docId) => api.get(`/documents/${docId}/comments`);
export const addComment = (docId, body) => api.post(`/documents/${docId}/comments`, { body });
export const deleteCommentApi = (commentId) => api.delete(`/documents/comments/${commentId}`);



export default api;

