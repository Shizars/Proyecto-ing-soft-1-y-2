// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./DashboardPage.css";

export default function DashboardPage() {
  const [menuOpen, setMenuOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [formData, setFormData] = useState({
    file: null,
    name: "",
    day: "",
    month: "",
    year: "",
    category: "",
    region: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Carga de documentos
    loadDocuments();
    // Obtiene nombre de usuario de localStorage
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUserName(storedUser?.nombre_usuario || storedUser?.email || "Usuario");
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await api.get("/documents");
      setDocuments(res.data);
    } catch (err) {
      console.error("Load documents error:", err);
    }
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const openModal = () => setModalOpen(true);
  const closeModal = () => {
    setModalOpen(false);
    setFormData({
      file: null,
      name: "",
      day: "",
      month: "",
      year: "",
      category: "",
      region: "",
    });
    setError("");
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setFormData((prev) => ({ ...prev, file: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.file) {
      setError("Elija un archivo.");
      return;
    }

    const payload = new FormData();
    payload.append("file", formData.file);
    payload.append("nombre", formData.name);
    payload.append("dia", formData.day);
    payload.append("mes", formData.month);
    payload.append("anno", formData.year);
    payload.append("categoria", formData.category);
    payload.append("region", formData.region);

    setLoading(true);
    try {
      await api.post("/documents/upload", payload);
      await loadDocuments();
      closeModal();
      setSuccess("El documento se subió de manera exitosa.");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Upload error:", err.response || err);
      setError(err.response?.data?.error || "Error al subir documento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <button className="toggle-btn" onClick={toggleMenu}>
          ☰
        </button>
        <nav className="menu-items">
          <button onClick={openModal}>Agregar documento</button>
          <button
            onClick={() => {
              /* logout logic */
            }}
          >
            Cerrar sesión
          </button>
        </nav>
      </aside>

      <main className="content">
        {/* Header simulado de sesión iniciada */}
        <div className="dashboard-header">
          <h2>Bienvenido, {userName}</h2>
          <p>
            Bienvenido al sistema de gestión documental de la Fundación Cuidad
            Del Niño.
          </p>
        </div>
        <h1>Documentos</h1>

        {success && <div className="success">{success}</div>}
        <table className="doc-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Código del documento</th>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Región</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.id}</td>
                <td>{doc.titulo}</td>
                <td>{`${doc.dia}/${doc.mes}/${doc.anno}`}</td>
                <td>{doc.categoria}</td>
                <td>{doc.region}</td>
                <td>{doc.formato}</td>
                <td>
                  <button
                    onClick={() => api.get(`/documents/${doc.id}/download`)}
                  >
                    Descargar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Agregar Documento</h2>
            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label>Archivo</label>
                <input type="file" name="file" onChange={handleChange} />
              </div>
              <div className="field-group">
                <label>Código del documento</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="field-group date-group">
                <label>Fecha</label>
                <input
                  type="text"
                  name="day"
                  placeholder="DD"
                  value={formData.day}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="month"
                  placeholder="MM"
                  value={formData.month}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="year"
                  placeholder="YYYY"
                  value={formData.year}
                  onChange={handleChange}
                />
              </div>
              <div className="field-group">
                <label>Categoría</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                />
              </div>
              <div className="field-group">
                <label>Región</label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                />
              </div>

              {error && <span className="error">{error}</span>}

              <div className="modal-actions">
                <button type="submit" disabled={loading}>
                  {loading ? "Subiendo..." : "Agregar"}
                </button>
                <button type="button" onClick={closeModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
