// src/components/TagChip.jsx
import React from "react";
import "./TagChip.css"; // estilos simples opcionales

export default function TagChip({ tag, onDelete }) {
  return (
    <span className="tag-chip">
      {tag.nombre}
      {onDelete && (
        <button className="tag-del" onClick={() => onDelete(tag.id)}>
          ×
        </button>
      )}
    </span>
  );
}
