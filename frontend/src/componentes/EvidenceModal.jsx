import React, { useEffect, useState } from "react";
import { fetchEvidences, uploadEvidence } from "../services/api";

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
    } catch (e2) {
      console.error(e2);
      setErr("No se pudo subir la evidencia.");
    } finally {
      setUploading(false);
      e.target.value = ""; // limpia input
    }
  };

  // Construye URL pública hacia /uploads/... (el backend guarda file_path relativo)
  const buildUrl = (ev) => {
    const rel = (ev.file_path || "").replace(/^\/?/, "");
    // mismo host donde corre el backend
    return `${window.location.origin}/${rel}`;
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
