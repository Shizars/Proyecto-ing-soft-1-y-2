import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import PdfPreviewModal from "../componentes/PdfPreviewModal";
import CategoryFilterModal from "../componentes/CategoryFilterModal";
import "./DashboardPage.css";
import CategoryPieChart from "../componentes/CategoryPieChart";
import SessionTimer from "../componentes/SessionTimer";
import logoCdn from "../img/cdn_docs.png"; // ← nuevo

export default function DashboardPage() {
  /* ---------- estados ---------- */
  const [menuOpen, setMenuOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [filterCats, setFilterCats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUploadedId, setLastUploadedId] = useState(null);

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

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

  /* ---------- tema ---------- */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  /* ---------- cargar docs ---------- */
  useEffect(() => {
    loadDocuments();
  }, []);
  const loadDocuments = async () => {
    try {
      setDocuments((await api.get("/documents/")).data);
    } catch (err) {
      console.error("Load documents error:", err);
    }
  };

  /* ---------- helpers ---------- */

  const openModal = () => setModalOpen(true);
  const closeModal = () => {
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
    setModalOpen(false);
  };

  /* ---------- descarga ---------- */
  const handleDownload = async (doc) => {
    try {
      alert("Iniciando descarga…"); // <- mensaje para el usuario
      const res = await api.get(`/documents/${doc.id}/download`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.titulo;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err.response || err);
      alert("No se pudo descargar el documento.");
    }
  };

  /* ---------- inputs ---------- */
  /* ---------- inputs ---------- */
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "file") {
      const file = files[0];
      if (file) {
        /* ←← NUEVO — límites de tamaño */
        const MAX_MB = 10;
        const MAX_BYTES = MAX_MB * 1024 * 1024;
        if (file.size > MAX_BYTES) {
          setError(`Tamaño máximo permitido: ${MAX_MB} MB.`);
          return;
        }

        const allowed = ["pdf", "doc", "docx", "xlsx"];
        const ext = file.name.split(".").pop().toLowerCase();
        if (!allowed.includes(ext)) {
          setError("Formato no permitido. Solo PDF, DOC, DOCX, XLSX.");
          return;
        }

        setFormData((p) => ({ ...p, file }));
        setError(""); // limpia cualquier error previo
      }
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      setError("Elija un archivo.");
      return;
    }
    setLoading(true);
    setError("");

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

    try {
      const response = await api.post("/documents/upload", payload);
      setLastUploadedId(response.data.id); // guarda el ID recién subido
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
      const { data } = await api.get(`/documents/${doc.id}/url`);
      let url = data.url;
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

  /* ---------- filtros ---------- */
  const sortedDocuments = [...documents].sort(
    (a, b) => new Date(b.fecha_subida) - new Date(a.fecha_subida)
  );

  const docsToShow = sortedDocuments.filter(
    (d) =>
      (filterCats.length === 0 || filterCats.includes(d.categoria)) &&
      (searchTerm.trim() === "" ||
        d.titulo.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const categoryOptions = [...new Set(documents.map((d) => d.categoria))];

  /* ---------- UI ---------- */
  return (
    <div className="dashboard">
      {/* ===== SIDEBAR ===== */}
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="sidebar-brand">
          <img
            src={logoCdn}
            alt="Fundación Ciudad del Niño"
            className="sidebar-logo"
          />
        </div>

        <div className="sidebar-profile">
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${
              (user?.nombre_usuario || "U")[0]
            }`}
            alt="avatar"
          />
          <span className="user-name">{user?.nombre_usuario}</span>
          <span className="user-email">{user?.email}</span>
        </div>

        <nav className="menu-items">
          <button onClick={openModal}>
            <i className="fas fa-file-upload" />
            <span>Agregar documento</span>
          </button>

          <button onClick={() => setCatOpen(true)}>
            <i className="fas fa-filter" />
            <span>Categorías</span>
          </button>

          <button onClick={() => setDarkMode((p) => !p)}>
            <i className={darkMode ? "fas fa-sun" : "fas fa-moon"} />
            <span>{darkMode ? "Modo claro" : "Modo oscuro"}</span>
          </button>

          <button onClick={logout}>
            <i className="fas fa-sign-out-alt" />
            <span>Cerrar sesión</span>
          </button>
        </nav>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="content">
        {/* ---- bloque “Overview” ---- */}
        <div className="overview-card">
          <header className="overview-head">
            <div>
              <h2>Tus carpetas</h2>
              <p>
                Crea carpetas personalizadas y accede rápidamente a los
                documentos de la fundación.
              </p>
            </div>
          </header>

          {/* mini-carpetas */}
          <div className="folder-grid">
            <div className="folder-card green">
              <span className="folder-id">01</span>
              <span className="folder-title">F-SGC-033-B</span>
            </div>
            <div className="folder-card purple">
              <span className="folder-id">02</span>
              <span className="folder-title">F-SGC-036</span>
            </div>
            <div className="folder-card gallery">
              <span className="folder-id">+</span>
              <span className="folder-title">Nueva carpeta</span>
            </div>
          </div>
        </div>
        <CategoryPieChart documents={documents} />

        {/* ---- sección documentos ---- */}
        <section className="files-section">
          {/* --- buscador antes del título --- */}
          <div className="files-top">
            <div className="search-box wide">
              <i className="fas fa-search" />
              <input
                className="doc-search"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <br />

          <h3 className="section-title">Tus documentos</h3>

          {success && <div className="success">{success}</div>}

          <div className="doc-list">
            {docsToShow.map((doc) => (
              <div
                key={doc.id}
                className={`doc-card ${
                  doc.id === lastUploadedId ? "highlight" : ""
                }`}
              >
                <div className="doc-id">#{doc.id}</div>
                <div className="doc-title truncado" title={doc.titulo}>
                  <strong>{doc.titulo}</strong>
                </div>
                <div className="doc-format">
                  {doc.formato ? doc.formato.toUpperCase() : "?"}
                </div>
                <div className="doc-date">
                  {doc.fecha_subida
                    ? new Date(doc.fecha_subida).toLocaleDateString()
                    : "—"}
                </div>
                <div className="doc-cat">{doc.categoria}</div>
                <div className="doc-actions">
                  <button
                    onClick={() => handleDownload(doc)}
                    title="Descargar documento"
                  >
                    <i className="fas fa-download" />
                  </button>
                  <button
                    onClick={() => handlePreview(doc)}
                    title="Ver documento"
                  >
                    <i className="fas fa-eye" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <SessionTimer onTimeout={logout} />
        </section>
      </main>

      {/* ===== MODALES ===== */}
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
            <form onSubmit={handleSubmit}>
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
                <label
                  className="help-icon"
                  title="Ingrese el programa correspodiente al documento. Ej: PEE, REE, o AFT."
                >
                  Categoría
                </label>
                <input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field-group">
                <label
                  className="help-icon"
                  title="Ingrese la región correspondiente al documento. Ej: Metropolitana, Valparaíso."
                >
                  Región
                </label>
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
