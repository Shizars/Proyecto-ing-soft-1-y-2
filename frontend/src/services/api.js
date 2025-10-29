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

export const archiveDocument = (docId, folder_code) =>
  api.patch(`/documents/${docId}/archive`, { folder_code });

export const unarchiveDocument = (docId) =>
  api.patch(`/documents/${docId}/unarchive`);

export const renameDocument = (docId, newName) =>
  api.put(`/documents/${docId}/rename`, { titulo: newName });

// Evidencias

export const listEvidences = (docId) => {
  return api.get(`/documents/${docId}/evidences`);

};

// Evidencias: listar y subir

// === Evidencias ===
export const fetchEvidences = (docId) =>
  api.get(`/documents/${docId}/evidences`);

export const uploadEvidence = (docId, file) => {
  const fd = new FormData();
  fd.append("file", file);              // 👈 clave: "file"
  return api.post(`/documents/${docId}/evidences`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};



export const trashDocument = (id) =>
  api.patch(`/documents/${id}/trash`);

export const restoreDocument = (id) =>
  api.patch(`/documents/${id}/restore`);

export const listDocuments = (includeDeleted = false) =>
  api.get(`/documents/?include_deleted=${includeDeleted ? "1" : "0"}`);


export const bulkDownload = (ids) =>
  api.post(`/documents/bulk-download`, { ids }, { responseType: "blob" });

// --- Reminders ---
export const getReminders = () => api.get("/reminders/");
export const addReminder = (payload) => api.post("/reminders/", payload);
export const deleteReminderApi = (id) => api.delete(`/reminders/${id}`);
export const markReminderDone = (id, done = true) =>
  api.patch(`/reminders/${id}`, { done });

// --- Access Logs ---
export const getAccessLogs = (page = 1, per_page = 25) =>
  api.get(`/access-logs/?page=${page}&per_page=${per_page}`);
// PUT /api/users/me  -> actualiza nombre y correo del usuario logueado


// ...resto de imports y configuración axios
export const updateProfile = (payload) =>
  api.put("/users/me", payload); // coincide con /api/users/me del backend


export default api;

