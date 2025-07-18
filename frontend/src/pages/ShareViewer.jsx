// src/pages/ShareViewer.jsx
import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { toast } from "react-toastify";

export default function ShareViewer() {
  const { token } = useParams();
  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/documents/shared/${token}/url`, {
          // este GET es público → no envíes Authorization
          headers: {},
        });
        setFileUrl(data.url);
      } catch {
        toast.error("El enlace ha expirado o es inválido.");
      }
    })();
  }, [token]);

  if (!fileUrl) return <p>Cargando…</p>;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* —— visor —— */}
      <iframe
        title="Documento compartido"
        src={fileUrl}
        style={{ flex: 1, border: "none" }}
      />

      {/* —— barra inferior con link y copiar —— */}
      <div style={{ padding: "12px", background: "#f4f6f8" }}>
        <input
          value={window.location.href}
          readOnly
          onFocus={(e) => e.target.select()}
          style={{
            width: "80%",
            padding: "8px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
          }}
        />
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success("¡Copiado al portapapeles!");
          }}
          style={{
            marginLeft: "12px",
            padding: "8px 16px",
            background: "#179c5a",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Copiar enlace
        </button>
      </div>
    </div>
  );
}
