// frontend/src/componentes/EvidenceModal.jsx

import React, { useEffect, useState } from "react";
import {
  fetchEvidences,
  uploadEvidence,
  deleteEvidence,
} from "../services/api";
import { toast } from "react-toastify";

export default function EvidenceModal({ isOpen, doc, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    if (!doc) return;
    setLoading(true);
    setErr("");
    try {
      const { data } = await fetchEvidences(doc.id);
      // data: { items: [...] }
      setItems(data.items || []);
    } catch (e) {
      console.error(e);
      setErr("No se pudieron cargar las evidencias.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, doc?.id]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !doc) return;
    setUploading(true);
    setErr("");
    try {
      await uploadEvidence(doc.id, file);
      await load(); // refresca lista
      toast.success("Evidencia subida correctamente.");
    } catch (e2) {
      console.error(e2);
      setErr("No se pudo subir la evidencia.");
      toast.error("No se pudo subir la evidencia.");
    } finally {
      setUploading(false);
      e.target.value = ""; // limpia input
    }
  };

  const handleDeleteEvidence = async (evidenceId) => {
    if (!doc) return;
    const ok = window.confirm(
      "¿Eliminar esta evidencia? Esta acción no se puede deshacer."
    );
    if (!ok) return;

    try {
      await deleteEvidence(doc.id, evidenceId);
      setItems((prev) => prev.filter((ev) => ev.id !== evidenceId));
      toast.success("Evidencia eliminada correctamente.");
    } catch (err) {
      console.error("Error eliminando evidencia:", err?.response || err);
      const msg =
        err?.response?.data?.error || "No se pudo eliminar la evidencia.";
      toast.error(msg);
    }
  };

  // Construye URL pública hacia /uploads/... (el backend guarda file_path relativo)
  const buildUrl = (ev) => {
    const rel = (ev.file_path || "").replace(/^\/?/, ""); // "uploads/evidences/..."

    const { protocol, hostname } = window.location;
    // mismo host donde corre el frontend; si tu backend está en otra URL en producción,
    // considera usar process.env.REACT_APP_API_BASE_URL para construir la URL pública.
    // Ej: `${process.env.REACT_APP_API_BASE_URL.replace(/\/api$/, "")}/${rel}`
    const backendOrigin = `${protocol}//${hostname}:5000`;
    return `${backendOrigin}/${rel}`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ margin: 0 }}>Evidencias de: {doc?.titulo}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div style={{ margin: "12px 0 16px" }}>
          <label
            className="chip-toggle"
            style={{ cursor: "pointer", display: "inline-flex" }}
          >
            {uploading ? "Subiendo..." : "Subir evidencia"}
            <input
              type="file"
              onChange={handleUpload}
              style={{ display: "none" }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />
          </label>
        </div>

        {err && (
          <div className="error" style={{ marginBottom: 10 }}>
            {err}
          </div>
        )}

        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Cargando…</p>
        ) : items.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            No hay evidencias cargadas.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 8,
              maxHeight: "50vh",
              overflow: "auto",
            }}
          >
            {items.map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 8,
                  alignItems: "center",
                  padding: "8px 10px",
                  border: "1px solid var(--card-border)",
                  borderRadius: 8,
                  background: "var(--card-bg)",
                }}
              >
                <div style={{ overflow: "hidden" }}>
                  <div
                    style={{
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={ev.filename}
                  >
                    {ev.filename}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {new Date(ev.uploaded_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <a
                    href={buildUrl(ev)}
                    target="_blank"
                    rel="noreferrer"
                    className="chip-toggle"
                    style={{
                      textDecoration: "none",
                      padding: "6px 10px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <i className="fas fa-download" />
                    Abrir
                  </a>

                  <button
                    onClick={() => handleDeleteEvidence(ev.id)}
                    title="Eliminar evidencia"
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: 8,
                    }}
                  >
                    <i
                      className="fas fa-trash-alt"
                      style={{ color: "#ef4444" }}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
