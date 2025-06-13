import React, { useState, useEffect } from "react";
import "./CategoryFilterModal.css";

export default function CategoryFilterModal({
  isOpen,
  categories = [],
  selected = [],
  onSave,
  onClose,
}) {
  const [local, setLocal] = useState([]);

  useEffect(() => setLocal(selected), [selected]);

  if (!isOpen) return null;

  const toggle = (cat) =>
    setLocal((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  return (
    <div className="cat-modal-overlay" onClick={onClose}>
      <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
        <header className="cat-modal-header">
          <h3>Filtrado de categorías</h3>
          <button className="cat-close" onClick={onClose}>
            ✕
          </button>
        </header>

        <h4 className="cat-subtitle">Modelo intervención</h4>
        <div className="cat-list">
          {categories.map((cat) => (
            <label key={cat} className="cat-item">
              <input
                type="checkbox"
                checked={local.includes(cat)}
                onChange={() => toggle(cat)}
              />
              {cat}
            </label>
          ))}
        </div>

        <div className="cat-actions">
          <button
            className="cat-save"
            onClick={() => {
              onSave(local);
              onClose();
            }}
          >
            Guardar categoría
          </button>
          <button className="cat-cancel" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
