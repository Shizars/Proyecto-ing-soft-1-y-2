import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import PdfPreviewModal from "../componentes/PdfPreviewModal";
import CategoryFilterModal from "../componentes/CategoryFilterModal";
import "./DashboardPage.css";

export default function DashboardPage() {
  /* ---------------------- estados ---------------------- */
  const [menuOpen, setMenuOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [filterCats, setFilterCats] = useState([]); // categorías filtradas
  const [searchTerm, setSearchTerm] = useState(""); // NUEVO

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

  /* ---------------------- cargar docs ------------------ */
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

  /* ---------------------- utils UI --------------------- */
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

  /* ---------------------- formulario ------------------- */
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      const file = files[0];
      if (file) {
        const allowed = ["pdf", "doc", "docx", "xlsx"];
        const ext = file.name.split(".").pop().toLowerCase();
        if (!allowed.includes(ext)) {
          setError("Formato no permitido. Solo PDF, DOC, DOCX, XLSX.");
          return;
        }
        setFormData((p) => ({ ...p, file }));
        setError("");
      }
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
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
    Object.entries({
      file: formData.file,
      nombre: formData.name,
      dia: formData.day,
      mes: formData.month,
      anno: formData.year,
      categoria: formData.category,
      region: formData.region,
    }).forEach(([k, v]) => payload.append(k, v));

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

  /* ---------------------- preview ---------------------- */
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

  /* ---------------------- filtrado --------------------- */
  const docsToShow = documents.filter(
    (d) =>
      (filterCats.length === 0 || filterCats.includes(d.categoria)) &&
      (searchTerm.trim() === "" ||
        d.titulo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const categoryOptions = [...new Set(documents.map((d) => d.categoria))];

  /* ========================= UI ======================== */
  return (
    <div className="dashboard">
      {/* ---------- SIDEBAR ---------- */}
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <button className="toggle-btn" onClick={toggleMenu}>
          ☰
        </button>
        <nav className="menu-items">
          <button onClick={openModal}>
            <i className="fas fa-file-upload"></i>
            <span>Agregar documento</span>
          </button>
          <button onClick={() => setCatOpen(true)}>
            <i className="fas fa-filter"></i>
            <span>Categorías</span>
          </button>
          <button
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Cerrar sesión</span>
          </button>
        </nav>
      </aside>

      {/* ---------- CONTENIDO ---------- */}
      <main className="content">
        {/* Tarjeta de bienvenida */}
        <div className="welcome-card">
          <div className="welcome-text">
            <h1>¡Hola, {user?.nombre_usuario || user?.email || "Usuario"}!</h1>
            <p>
              Bienvenido al sistema de gestión documental de la Fundación Ciudad
              del Niño.
            </p>
          </div>
          <div className="welcome-avatar">
            <i className="fas fa-user-circle"></i>
          </div>
        </div>

        {/* Cabecera documentos + búsqueda */}
        <div className="docs-header">
          <h1>Documentos</h1>
          <div className="search-box">
            <i className="fas fa-search" />
            <input
              type="text"
              className="doc-search"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {success && <div className="success">{success}</div>}

        {/* Lista tipo tarjeta */}
        <div className="doc-list">
          {docsToShow.map((doc) => (
            <div key={doc.id} className="doc-card">
              <div className="doc-id">#{doc.id}</div>
              <div className="doc-title">
                <strong>{doc.titulo}</strong>
              </div>
              <div className="doc-format">{doc.formato.toUpperCase()}</div>
              <div className="doc-date">
                {doc.fecha_subida
                  ? new Date(doc.fecha_subida).toLocaleDateString()
                  : "—"}
              </div>
              <div className="doc-cat">{doc.categoria}</div>
              <div className="doc-actions">
                <button
                  onClick={() => api.get(`/documents/${doc.id}/download`)}
                >
                  <i className="fas fa-download"></i>
                </button>
                <button onClick={() => handlePreview(doc)}>
                  <i className="fas fa-eye"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ---------- MODALES ---------- */}
      <PdfPreviewModal
        isOpen={previewOpen}
        url={previewUrl}
        onClose={() => setPreviewOpen(false)}
      />

      <CategoryFilterModal
        isOpen={catOpen}
        categories={categoryOptions}
        selected={filterCats}
        onSave={setFilterCats}
        onClose={() => setCatOpen(false)}
      />

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Agregar Documento</h2>
            {/* ---- formulario de subida ---- */}
            <form onSubmit={handleSubmit}>
              {/* campos ya existentes */}
              <div className="field-group">
                <label>Archivo</label>
                <input type="file" name="file" onChange={handleChange} />
              </div>
              <div className="field-group">
                <label>Código del documento</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="field-group date-group">
                <label>Fecha</label>
                <input
                  name="day"
                  placeholder="DD"
                  value={formData.day}
                  onChange={handleChange}
                />
                <input
                  name="month"
                  placeholder="MM"
                  value={formData.month}
                  onChange={handleChange}
                />
                <input
                  name="year"
                  placeholder="YYYY"
                  value={formData.year}
                  onChange={handleChange}
                />
              </div>
              <div className="field-group">
                <label>Categoría</label>
                <input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                />
              </div>
              <div className="field-group">
                <label>Región</label>
                <input
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
