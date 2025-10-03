import React, { useEffect, useState } from "react";
import { getComments, addComment, deleteCommentApi } from "../services/api";
import "./CommentsPanel.css";

export default function CommentsPanel({ docId }) {
  const [rows, setRows] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await getComments(docId);
      setRows(res.data || []);
    } catch (e) {
      console.error("comments load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (docId) load();
  }, [docId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await addComment(docId, text.trim());
      setText("");
      load();
    } catch (e) {
      console.error("add comment error:", e);
      alert("No se pudo agregar el comentario");
    }
  };

  const del = async (id) => {
    if (!window.confirm("¿Eliminar comentario?")) return;
    try {
      await deleteCommentApi(id);
      setRows((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error("delete comment error:", e);
      alert("No se pudo eliminar");
    }
  };

  return (
    <aside className="comments-card">
      <h4>Comentarios</h4>

      <form className="comment-form" onSubmit={submit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un comentario…"
        />
        <button type="submit">Agregar</button>
      </form>

      {loading ? (
        <div className="muted">Cargando…</div>
      ) : rows.length === 0 ? (
        <div className="muted">Sin comentarios</div>
      ) : (
        <ul className="comment-list">
          {rows.map((c) => (
            <li key={c.id} className="comment-item">
              <div className="meta">
                <time>{new Date(c.created_at).toLocaleString()}</time>
                <button onClick={() => del(c.id)} title="Eliminar">
                  ×
                </button>
              </div>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
