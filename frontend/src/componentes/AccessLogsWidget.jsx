// frontend/src/componentes/AccessLogsWidget.jsx
import React, { useEffect, useState } from "react";
import { getAccessLogs } from "../services/api";

export default function AccessLogsWidget() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const perPage = 25;

  const load = async (p = 1) => {
    try {
      const { data } = await getAccessLogs(p, perPage);
      setRows(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch (e) {
      console.error(e);
      alert("No se pudieron cargar los accesos.");
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 8 }}>Registro de accesos</h3>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
        Total: {total} • Página {page}/{pages}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ width: "100%", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Fecha/Hora</th>
              <th style={{ textAlign: "left" }}>Usuario</th>
              <th style={{ textAlign: "left" }}>Email</th>
              <th style={{ textAlign: "left" }}>IP</th>
              <th style={{ textAlign: "left" }}>Agente</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: "#888" }}>
                  Sin accesos registrados.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleString()}</td>
                <td>{r.user_id ?? "—"}</td>
                <td>{r.user_email || "—"}</td>
                <td>{r.ip || "—"}</td>
                <td
                  title={r.user_agent}
                  style={{
                    maxWidth: 320,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.user_agent || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación simple */}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          onClick={() => load(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          ◀ Anterior
        </button>
        <button
          onClick={() => load(Math.min(pages, page + 1))}
          disabled={page >= pages}
        >
          Siguiente ▶
        </button>
      </div>
    </div>
  );
}
