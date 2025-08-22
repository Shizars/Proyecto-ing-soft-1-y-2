import React, { useMemo, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { setTags, removeTag } from "../services/api";
import "./TagSelector.css"; // opcional (chips, botones)

export default function TagSelector({ doc, refresh }) {
  /* transforma [{id, nombre}] -> [{label,value}] */
  const toOptions = (tags) =>
    tags.map((t) => ({ label: t.nombre, value: t.nombre }));

  const [options, setOptions] = useState(toOptions(doc.tags));
  const [editMode, setEditMode] = useState(false);

  const save = async () => {
    await setTags(
      doc.id,
      options.map((o) => o.value)
    );
    setEditMode(false);
    refresh(); // recarga lista en DashboardPage
  };

  const del = async (id) => {
    await removeTag(doc.id, id);
    refresh();
  };

  /* chips cuando no se está editando */
  if (!editMode)
    return (
      <div className="tags-view">
        {doc.tags.length
          ? doc.tags.map((t) => (
              <span key={t.id} className="tag-chip">
                {t.nombre}
                <button onClick={() => del(t.id)}>×</button>
              </span>
            ))
          : "—"}
        <button className="edit" onClick={() => setEditMode(true)}>
          ✎
        </button>
      </div>
    );

  /* selector si está en modo edición */
  return (
    <div className="tags-edit">
      <CreatableSelect
        isMulti
        value={options}
        onChange={setOptions}
        placeholder="Añadir etiquetas…"
      />
      <button onClick={save}>Guardar</button>
      <button onClick={() => setEditMode(false)}>Cancelar</button>
    </div>
  );
}
