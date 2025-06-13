import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import PdfPreviewModal from "../componentes/PdfPreviewModal";
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

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await api.get("/documents/");
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
      const file = files[0];
      if (file) {
        const allowedExtensions = ["pdf", "doc", "docx", "xlsx"];
        const extension = file.name.split(".").pop().toLowerCase();

        if (!allowedExtensions.includes(extension)) {
          setError(
            "Formato no permitido. Solo se aceptan: PDF, DOC, DOCX, XLSX."
          );
          return;
        }

        setFormData((prev) => ({ ...prev, file }));
        setError(""); // limpiar errores anteriores
      }
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

  const handlePreview = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}/url`);
      let url = res.data.url;

      if (doc.formato !== "pdf") {
        url = `https://docs.google.com/gview?url=${encodeURIComponent(
          url
        )}&embedded=true`;
      }

      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch (err) {
      console.error("Preview error:", err.response || err);
      alert("No se pudo cargar la vista previa.");
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
              logout();
              window.location.href = "/";
            }}
          >
            Cerrar sesión
          </button>
        </nav>
      </aside>

      <main className="content">
        <div className="dashboard-header">
          <h2>
            Bienvenido/a, {user?.nombre_usuario || user?.email || "Usuario"}
          </h2>
          <p>
            Bienvenido al sistema de gestión documental de la Fundación Ciudad
            Del Niño.
          </p>
        </div>
        <h1>Documentos</h1>

        {success && <div className="success">{success}</div>}

        <table className="doc-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Formato</th>
              <th>Fecha de subida</th>
              <th>Categoria</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.id}</td>
                <td>{doc.titulo}</td>
                <td>{doc.formato}</td>
                <td>
                  {doc.fecha_subida
                    ? new Date(doc.fecha_subida).toLocaleString()
                    : "—"}
                </td>
                <td>{doc.categoria}</td>
                <td>
                  <button
                    onClick={() => api.get(`/documents/${doc.id}/download`)}
                  >
                    Descargar
                  </button>
                  <button onClick={() => handlePreview(doc)}>Ver</button>
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

      {/* Modal de vista previa */}
      <PdfPreviewModal
        isOpen={previewOpen}
        url={previewUrl}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
