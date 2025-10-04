import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PdfPreviewModal from "../componentes/PdfPreviewModal";
import CategoryFilterModal from "../componentes/CategoryFilterModal";
import "./DashboardPage.css";
import CategoryPieChart from "../componentes/CategoryPieChart";
import SessionTimer from "../componentes/SessionTimer";
import logoCdn from "../img/cdn_docs.png";
import TagSelector from "../componentes/TagSelector";

import AuditFormV2 from "../componentes/AuditFormV2";
import ProgramResponsesWidget from "../componentes/ProgramResponsesWidget";
import ProgramRankingWidget from "../componentes/ProgamRankingWidget";
import SatisfactionForm from "../componentes/SatisfactionForm";
import SatisfactionOverallWidget from "../componentes/SatisfactionOverallWidget";
import SatisfactionByProgramWidget from "../componentes/SatisfactionByProgramWidget";
import ExistenciaWidget from "../componentes/ExistenciaWidget";
import { exportSatisfactionCSV, exportAuditsCSV } from "../services/exports";
import { deleteDocument } from "../services/api";
import { toggleFavorite } from "../services/api";
import { archiveDocument, unarchiveDocument } from "../services/api";
import { renameDocument } from "../services/api";
import EvidenceModal from "../componentes/EvidenceModal";

export default function DashboardPage() {
  /* ---------- estados ---------- */
  const [menuOpen, setMenuOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [filterCats, setFilterCats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [lastUploadedId, setLastUploadedId] = useState(null);
  const [satisfOpen, setSatisfOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null); // ej: "F-SGC-033-B" | "F-SGC-036" | null
  const [showArchived, setShowArchived] = useState(false); // ver archivados o activos
  const [openArchiveId, setOpenArchiveId] = useState(null);

  const [filterType, setFilterType] = useState("nombre");
  const [filterValue, setFilterValue] = useState("");

  const [evidOpen, setEvidOpen] = useState(false);
  const [evidDoc, setEvidDoc] = useState(null);

  const openEvidences = (doc) => {
    setEvidDoc(doc);
    setEvidOpen(true);
  };
  const closeEvidences = () => {
    setEvidOpen(false);
    setEvidDoc(null);
  };

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  // después de cargar documents
  const nameCounts = documents.reduce((acc, d) => {
    acc[d.titulo] = (acc[d.titulo] || 0) + 1;
    return acc;
  }, {});

  // Descarga un blob CSV usando el promise del servicio
  const downloadCsv = async (promise, filename) => {
    try {
      const res = await promise;
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exportando:", err);
      alert("No se pudo exportar el archivo.");
    }
  };
  useEffect(() => {
    const handleClickOutside = (e) => {
      // si no hay menú abierto, no hacemos nada
      if (openArchiveId == null) return;

      // Busca el dropdown más cercano al target del click
      const dd = e.target.closest(".archive-dropdown");

      // Si el click fue dentro de un dropdown
      if (dd) {
        // ¿Corresponde al doc actualmente abierto?
        const clickedId = dd.getAttribute("data-docid");
        if (String(clickedId) === String(openArchiveId)) {
          // Es el mismo dropdown abierto → NO cerrar
          return;
        }
      }

      // Si no es el mismo dropdown, o el click fue fuera → cerrar
      setOpenArchiveId(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openArchiveId]);

  // Modal de auditoría controlado por la URL
  const auditModalOpen = pathname.startsWith("/dashboard/auditorias/nueva");
  // Programas (puedes traerlos del backend o definirlos aquí)
  const PROGRAMAS = ["DAM", "PEE", "PIE", "PPF", "PRM", "PSA", "PLA", "PLE"];

  // Bloquear scroll del fondo cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = auditModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [auditModalOpen]);

  // Cerrar modal y volver a /dashboard
  const closeAudit = () => navigate("/dashboard");

  // Cerrar con tecla ESC
  useEffect(() => {
    if (!auditModalOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeAudit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [auditModalOpen]);

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
      alert("Iniciando descarga…");
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
  /*------------Eliminar---------------*/
  const handleDelete = async (doc) => {
    const ok = window.confirm(
      `¿Eliminar el documento "${doc.titulo}"? Esta acción es permanente.`
    );
    if (!ok) return;
    try {
      await deleteDocument(doc.id);
      await loadDocuments();
    } catch (err) {
      console.error("Delete error:", err?.response || err);
      alert(err?.response?.data?.error || "No se pudo eliminar el documento.");
    }
  };

  /* ---------- inputs ---------- */
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "file") {
      const file = files[0];
      if (file) {
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
        setError("");
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

    const buildPayload = (allowDup = false) => {
      const fd = new FormData();
      Object.entries({
        file: formData.file,
        nombre: formData.name,
        dia: formData.day,
        mes: formData.month,
        anno: formData.year,
        categoria: formData.category,
        region: formData.region,
      }).forEach(([k, v]) => fd.append(k, v));
      if (allowDup) fd.append("allow_duplicate", "1");
      return fd;
    };

    try {
      // intento normal (sin duplicados)
      const response = await api.post("/documents/upload", buildPayload(false));

      // ⬅️ usar el id correcto devuelto por el backend
      setLastUploadedId(response.data.document.id);

      await loadDocuments();

      // Quita el highlight después de 3 segundos
      setTimeout(() => setLastUploadedId(null), 3000);

      closeModal();
      setSuccess("El documento se subió de manera exitosa.");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 409 && data?.error === "DUPLICATE") {
        // 1) Pregunta simple: ¿subir igual?
        const subirIgual = window.confirm(
          `${data.message}\n\n¿Deseas subirlo de todas formas (quedarán 2 archivos con el mismo nombre)?`
        );

        if (subirIgual) {
          try {
            const res2 = await api.post(
              "/documents/upload",
              buildPayload(true)
            );
            setLastUploadedId(res2.data.document.id);
            await loadDocuments();
            setTimeout(() => setLastUploadedId(null), 3000);
            closeModal();
            setSuccess("Documento subido (duplicado permitido).");
            setTimeout(() => setSuccess(""), 5000);
            return;
          } catch (e2) {
            console.error(
              "Upload (allow_duplicate) error:",
              e2?.response || e2
            );
            setError(e2?.response?.data?.error || "Error al subir duplicado.");
            return;
          }
        }

        // 2) Si no quiere subir igual, ofrecer borrar el existente y subir
        const borrarYSubir = window.confirm(
          "¿Deseas eliminar el archivo existente y subir este nuevo en su lugar?"
        );
        if (borrarYSubir) {
          try {
            await deleteDocument(data.existing_id);
            const res3 = await api.post(
              "/documents/upload",
              buildPayload(false)
            );
            setLastUploadedId(res3.data.document.id);
            await loadDocuments();
            setTimeout(() => setLastUploadedId(null), 3000);
            closeModal();
            setSuccess("Documento reemplazado exitosamente.");
            setTimeout(() => setSuccess(""), 5000);
            return;
          } catch (e3) {
            console.error("Reemplazo error:", e3?.response || e3);
            setError(
              e3?.response?.data?.error || "No se pudo reemplazar el documento."
            );
            return;
          }
        }

        // 3) Canceló todo
        setError("Operación cancelada por el usuario.");
      } else {
        console.error("Upload error:", err?.response || err);
        setError(err?.response?.data?.error || "Error al subir documento.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (doc) => {
    try {
      await toggleFavorite(doc.id);
      await loadDocuments(); // refresca la lista con el nuevo estado
    } catch (err) {
      console.error("Favorite toggle error:", err?.response || err);
      alert("No se pudo cambiar favorito.");
    }
  };
  const handleArchive = async (doc, folder_code) => {
    try {
      await archiveDocument(doc.id, folder_code);
      await loadDocuments();
    } catch (err) {
      console.error("Archive error:", err?.response || err);
      alert(err?.response?.data?.error || "No se pudo archivar el documento.");
    }
  };

  const handleUnarchive = async (doc) => {
    try {
      await unarchiveDocument(doc.id);
      await loadDocuments();
    } catch (err) {
      console.error("Unarchive error:", err?.response || err);
      alert("No se pudo desarchivar el documento.");
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
      setSelectedDoc(doc);
      setPreviewOpen(true); // 👈 faltaba
    } catch (err) {
      console.error("Preview error:", err.response || err);
      alert("No se pudo cargar la vista previa.");
    }
  };

  /* ---------- compartir ---------- */
  const handleShare = async (doc) => {
    try {
      const { data } = await api.post(`/documents/${doc.id}/share`);
      const url = data.url;
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Enlace copiado al portapapeles");
      } catch {
        toast.info(`Enlace listo para compartir:\n${url}`);
      }
    } catch (err) {
      console.error("Share error:", err);
      toast.error("No se pudo generar el enlace");
    }
  };

  /* ---------- filtros ---------- */
  const sortedDocuments = [...documents].sort(
    (a, b) => new Date(b.fecha_subida) - new Date(a.fecha_subida)
  );
  const docsToShow = sortedDocuments
    // filtros existentes
    .filter(
      (d) =>
        (filterCats.length === 0 || filterCats.includes(d.categoria)) &&
        (searchTerm.trim() === "" ||
          d.titulo.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!onlyFavs || d.is_favorite === true) &&
        (showArchived ? d.archived === true : d.archived !== true) &&
        (!selectedFolder || d.folder_code === selectedFolder)
    )
    // filtro segmentado (nombre / fecha / categoría)
    .filter((d) => {
      if (!filterValue) return true;

      if (filterType === "nombre") {
        return d.titulo.toLowerCase().includes(filterValue.toLowerCase());
      }
      if (filterType === "categoria") {
        return d.categoria?.toLowerCase().includes(filterValue.toLowerCase());
      }
      if (filterType === "fecha") {
        const fechaDoc = new Date(d.fecha_subida).toISOString().split("T")[0];
        return fechaDoc === filterValue;
      }
      return true;
    });

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
        </div>
        <span className="user-name">{user?.nombre_usuario}</span>
        <span className="user-email">{user?.email}</span>

        <nav className="menu-items">
          <button onClick={openModal}>
            <i className="fas fa-file-upload" />
            <span>Agregar documento</span>
          </button>

          <button onClick={() => navigate("/dashboard/auditorias/nueva")}>
            <i className="fas fa-clipboard-check" />
            <span>Nueva auditoría</span>
          </button>

          <button
            onClick={() =>
              downloadCsv(exportSatisfactionCSV(), "satisfaccion.csv")
            }
          >
            <i className="fas fa-download" />
            <span>Exportar Satisfacción</span>
          </button>

          <button
            onClick={() => downloadCsv(exportAuditsCSV(), "auditorias.csv")}
          >
            <i className="fas fa-download" />
            <span>Exportar Auditorías</span>
          </button>

          <button onClick={() => setSatisfOpen(true)}>
            <i className="fas fa-face-smile" />
            <span>Nueva satisfacción</span>
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
            {[
              { code: "F-SGC-033-B", label: "F-SGC-033-B", color: "green" },
              { code: "F-SGC-036", label: "F-SGC-036", color: "purple" },
            ].map((f) => (
              <div
                key={f.code}
                className={`folder-card ${f.color} ${
                  selectedFolder === f.code ? "active" : ""
                }`}
                onClick={() =>
                  setSelectedFolder(selectedFolder === f.code ? null : f.code)
                }
                title="Filtrar por carpeta"
                role="button"
              >
                <span className="folder-id">•</span>
                <span className="folder-title">{f.label}</span>
              </div>
            ))}

            <div className="folder-card gallery" title="(solo demostrativo)">
              <span className="folder-id">+</span>
              <span className="folder-title">Nueva carpeta</span>
            </div>
          </div>
        </div>

        <CategoryPieChart documents={documents} />

        <div
          className="widgets-row"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr", // 50/50 fijo
            gap: "16px",
            alignItems: "stretch",
            width: "100%",
          }}
        >
          <div style={{ maxWidth: "none" }}>
            <ProgramResponsesWidget refreshMs={3000} />
          </div>
          <div style={{ maxWidth: "none" }}>
            <ProgramRankingWidget refreshMs={3000} />
          </div>
          <div>
            <SatisfactionOverallWidget refreshMs={4000} threshold={4} />
          </div>
          <div>
            <SatisfactionByProgramWidget
              refreshMs={5000}
              threshold={4}
              minN={1}
            />
          </div>
          <div style={{ maxWidth: "none" }}>
            <ExistenciaWidget refreshMs={3000} />
          </div>
        </div>

        {/* ---- sección documentos ---- */}
        <section className="files-section">
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
          <button
            onClick={() => setOnlyFavs((v) => !v)}
            className={`chip-toggle ${onlyFavs ? "on" : ""}`}
            title="Ver solo favoritos"
          >
            <i className={onlyFavs ? "fas fa-star" : "far fa-star"} /> Favoritos
          </button>
          <button
            className={`chip-toggle ${showArchived ? "on" : ""}`}
            onClick={() => setShowArchived((v) => !v)}
            title={showArchived ? "Ver activos" : "Ver archivados"}
          >
            <i className="fas fa-box-archive" />{" "}
            {showArchived ? "Archivados" : "Activos"}
          </button>
          <div className="filter-controls">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="nombre">Nombre</option>
              <option value="fecha">Fecha</option>
              <option value="categoria">Categoría</option>
            </select>

            <input
              type={filterType === "fecha" ? "date" : "text"}
              placeholder={
                filterType === "nombre"
                  ? "Buscar por nombre..."
                  : filterType === "categoria"
                  ? "Buscar por categoría..."
                  : "Selecciona fecha"
              }
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
          </div>

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
                  {nameCounts[doc.titulo] > 1 && (
                    <span className="pill-dup" title="Nombre duplicado">
                      DUP
                    </span>
                  )}
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

                <div className="doc-tags">
                  <TagSelector doc={doc} refresh={loadDocuments} />
                </div>
                <button
                  onClick={() => {
                    const nuevo = prompt(
                      "Nuevo nombre para el documento:",
                      doc.titulo
                    );
                    if (nuevo && nuevo.trim() !== "") {
                      renameDocument(doc.id, nuevo.trim())
                        .then(() => loadDocuments())
                        .catch((err) => {
                          console.error("Rename error:", err?.response || err);
                          alert("No se pudo renombrar el documento.");
                        });
                    }
                  }}
                  title="Renombrar documento"
                >
                  <i className="fas fa-edit" />
                </button>

                <div className="doc-actions">
                  {/* Renombrar */}
                  <button
                    onClick={() => {
                      const nuevo = prompt(
                        "Nuevo nombre para el documento:",
                        doc.titulo
                      );
                      if (nuevo && nuevo.trim() !== "") {
                        renameDocument(doc.id, nuevo.trim())
                          .then(() => loadDocuments())
                          .catch((err) => {
                            console.error(
                              "Rename error:",
                              err?.response || err
                            );
                            alert("No se pudo renombrar el documento.");
                          });
                      }
                    }}
                    title="Renombrar documento"
                  >
                    <i className="fas fa-edit" />
                  </button>
                  <button
                    onClick={() => openEvidences(doc)}
                    title="Evidencias complementarias"
                  >
                    <i className="fas fa-paperclip" />
                  </button>

                  {/* Archivar / Desarchivar */}
                  {doc.archived ? (
                    <button
                      onClick={() => handleUnarchive(doc)}
                      title="Quitar de la carpeta"
                    >
                      <i className="fas fa-box-open" />
                    </button>
                  ) : (
                    <div className="archive-dropdown" data-docid={doc.id}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // evita cierres por burbujeo
                          setOpenArchiveId(
                            openArchiveId === doc.id ? null : doc.id
                          );
                        }}
                        title="Archivar en carpeta"
                      >
                        <i className="fas fa-box-archive" />
                      </button>

                      {openArchiveId === doc.id && (
                        <div
                          className="archive-menu"
                          onMouseDown={(e) => e.stopPropagation()} // no cerrar al click interno
                        >
                          <button
                            onClick={() => handleArchive(doc, "F-SGC-033-B")}
                          >
                            F-SGC-033-B
                          </button>
                          <button
                            onClick={() => handleArchive(doc, "F-SGC-036")}
                          >
                            F-SGC-036
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Favoritos */}
                  <button
                    onClick={() => handleToggleFavorite(doc)}
                    title={
                      doc.is_favorite
                        ? "Quitar de favoritos"
                        : "Marcar como favorito"
                    }
                    className={`fav-btn ${doc.is_favorite ? "on" : ""}`}
                  >
                    <i
                      className={
                        doc.is_favorite ? "fas fa-star" : "far fa-star"
                      }
                    />
                  </button>

                  {/* Descargar */}
                  <button
                    onClick={() => handleDownload(doc)}
                    title="Descargar documento"
                  >
                    <i className="fas fa-download" />
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => handleDelete(doc)}
                    title="Eliminar documento"
                    className="danger"
                  >
                    <i className="fas fa-trash" />
                  </button>

                  {/* Ver */}
                  <button
                    onClick={() => handlePreview(doc)}
                    title="Ver documento"
                  >
                    <i className="fas fa-eye" />
                  </button>

                  {/* Compartir */}
                  <button
                    onClick={() => handleShare(doc)}
                    title="Copiar enlace"
                  >
                    <i className="fas fa-link" />
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
        docId={selectedDoc?.id} // ahora usamos el estado
        onClose={() => setPreviewOpen(false)}
      />

      <CategoryFilterModal
        isOpen={catOpen}
        categories={categoryOptions}
        selected={filterCats}
        onSave={setFilterCats}
        onClose={() => setCatOpen(false)}
      />

      {/* Modal de Auditoría */}
      {auditModalOpen && (
        <div className="modal-overlay" onClick={closeAudit}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={closeAudit}
              aria-label="Cerrar"
            >
              ×
            </button>
            <AuditFormV2 onSaved={closeAudit} onClose={closeAudit} />
          </div>
        </div>
      )}
      {satisfOpen && (
        <div className="modal-overlay" onClick={() => setSatisfOpen(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSatisfOpen(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <SatisfactionForm
              programas={PROGRAMAS}
              onSaved={() => setSatisfOpen(false)}
              onClose={() => setSatisfOpen(false)}
            />
          </div>
        </div>
      )}
      <EvidenceModal isOpen={evidOpen} doc={evidDoc} onClose={closeEvidences} />

      {/* Modal subir documento */}
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

      {/* Toast global */}
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}
