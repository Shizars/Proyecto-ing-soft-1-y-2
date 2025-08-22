import React, { useMemo, useState } from "react";
import { createAudit } from "../services/api";
import "./AuditForm.css";

/** Etiquetas de ítems basadas en el formulario F-SGC-033-B */
const EXI_ITEMS = [
  ["EXI_01", "Cédula de identidad (o pasaporte)"],
  ["EXI_02", "Certificado de nacimiento"],
  ["EXI_03", "Certificado de salud / controles"],
  ["EXI_04", "Certificado de alumno regular / situación educativa"],
  ["EXI_05", "Resolución judicial o ficha de derivación"],
  ["EXI_06", "Oficio de ingreso al programa"],
  ["EXI_07", "Ficha F-SGC-047 (ingreso/diagnóstico)"],
  ["EXI_08", "SIS (o “0 coincidencias”)"],
  ["EXI_09", "Carta F-SGC-034 (información al adulto)"],
  ["EXI_10", "PII-U al mes de ingreso (fechas)"],
  ["EXI_11", "Instrumentos obligatorios (mentalización/diagnóstico)"],
  ["EXI_12", "Orden de egreso (si egresado)"],
  ["EXI_13", "Ficha de egreso (si egresado)"],
];

const ACT_ITEMS = [
  ["ACT_01", "PII-U vigente / fechas actualizadas"],
  ["ACT_02", "Registro de actividades actualizado"],
  ["ACT_03", "Último informe trimestral + verificador de envío"],
];

export default function AuditForm({ onSaved, onClose }) {
  const hoyISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [saving, setSaving] = useState(false);

  // Encabezado / datos generales
  const [form, setForm] = useState({
    nna_identificador: "",
    nna_nombre: "",
    programa: "AFT",
    revisor: "",
    fecha_revision: hoyISO,
    condicion: "vigente", // vigente | egresado
    observaciones: "",
  });

  // Ítems (aplica/existe/fecha/verificador_url)
  const [items, setItems] = useState([
    ...EXI_ITEMS.map(([codigo, descripcion]) => ({
      codigo,
      descripcion,
      aplica: true,
      existe: false,
      fecha: null,
      verificador_url: "",
    })),
    ...ACT_ITEMS.map(([codigo, descripcion]) => ({
      codigo,
      descripcion,
      aplica: true,
      existe: false,
      fecha: null,
      verificador_url: "",
    })),
  ]);

  const handleHdr = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const toggle = (idx, key) =>
    setItems((arr) => {
      const copy = [...arr];
      copy[idx] = { ...copy[idx], [key]: !copy[idx][key] };
      return copy;
    });

  const setItemField = (idx, key, value) =>
    setItems((arr) => {
      const copy = [...arr];
      copy[idx] = { ...copy[idx], [key]: value || null };
      return copy;
    });

  // Cálculo en vivo (mismo criterio que backend)
  const scoreEXI = items.filter(
    (i) => i.codigo.startsWith("EXI_") && i.aplica && i.existe
  ).length;
  const scoreACT = items.filter(
    (i) => i.codigo.startsWith("ACT_") && i.aplica && i.existe
  ).length;

  const estadoExist =
    scoreEXI >= 12
      ? "Sobresaliente"
      : scoreEXI >= 9
      ? "Conforme"
      : "No conforme";
  const estadoAct =
    scoreACT === 3
      ? "Sobresaliente"
      : scoreACT === 2
      ? "Conforme"
      : "No conforme";

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, items };
      await createAudit(payload);
      onSaved?.();
      onClose?.();
    } catch (err) {
      alert(err.response?.data?.error || "No se pudo crear la auditoría");
    } finally {
      setSaving(false);
    }
  };

  // Regla visual: si condicion=egresado, EXI_12/13 sugeridos
  const esEgresado = form.condicion === "egresado";

  return (
    <div className="audit-form">
      <h2>Auditoría de Carpeta (F-SGC-033-B)</h2>

      {/* ===== Encabezado ===== */}
      <div className="audit-grid">
        <label>
          Identificador NNA (RUN / ID)
          <input
            name="nna_identificador"
            value={form.nna_identificador}
            onChange={handleHdr}
            required
          />
        </label>
        <label>
          Nombre NNA
          <input
            name="nna_nombre"
            value={form.nna_nombre}
            onChange={handleHdr}
          />
        </label>
        <label>
          Programa
          <select name="programa" value={form.programa} onChange={handleHdr}>
            <option>AFT</option>
            <option>PF</option>
          </select>
        </label>
        <label>
          Revisor
          <input
            name="revisor"
            value={form.revisor}
            onChange={handleHdr}
            required
          />
        </label>
        <label>
          Fecha revisión
          <input
            type="date"
            name="fecha_revision"
            value={form.fecha_revision}
            onChange={handleHdr}
            required
          />
        </label>
        <label>
          Condición
          <select name="condicion" value={form.condicion} onChange={handleHdr}>
            <option value="vigente">Vigente</option>
            <option value="egresado">Egresado</option>
          </select>
        </label>
      </div>

      {/* ===== Sección I – Existencia ===== */}
      <h3>Sección I – Existencia de documentos (13 ítems)</h3>
      <div className="items-table">
        <div className="row header">
          <div>Ítem</div>
          <div>Aplica</div>
          <div>Existe</div>
          <div>Fecha</div>
          <div>Verificador (URL opcional)</div>
        </div>
        {items
          .filter((i) => i.codigo.startsWith("EXI_"))
          .map((it, idx) => {
            const i = items.findIndex((x) => x.codigo === it.codigo);
            const debe =
              esEgresado && (it.codigo === "EXI_12" || it.codigo === "EXI_13");
            return (
              <div className={"row" + (debe ? " must" : "")} key={it.codigo}>
                <div className="desc">
                  <strong>{it.codigo}</strong> — {it.descripcion}
                </div>
                <div>
                  <input
                    type="checkbox"
                    checked={it.aplica}
                    onChange={() => toggle(i, "aplica")}
                  />
                </div>
                <div>
                  <input
                    type="checkbox"
                    checked={it.existe}
                    onChange={() => toggle(i, "existe")}
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={it.fecha || ""}
                    onChange={(e) => setItemField(i, "fecha", e.target.value)}
                  />
                </div>
                <div>
                  <input
                    type="url"
                    placeholder="https://… (opcional)"
                    value={it.verificador_url || ""}
                    onChange={(e) =>
                      setItemField(i, "verificador_url", e.target.value)
                    }
                  />
                </div>
              </div>
            );
          })}
      </div>

      {/* ===== Sección II – Actualización ===== */}
      <h3>Sección II – Actualización (3 ítems)</h3>
      <div className="items-table">
        <div className="row header">
          <div>Ítem</div>
          <div>Aplica</div>
          <div>Existe</div>
          <div>Fecha</div>
          <div>Verificador (URL opcional)</div>
        </div>
        {items
          .filter((i) => i.codigo.startsWith("ACT_"))
          .map((it, idx) => {
            const i = items.findIndex((x) => x.codigo === it.codigo);
            return (
              <div className="row" key={it.codigo}>
                <div className="desc">
                  <strong>{it.codigo}</strong> — {it.descripcion}
                </div>
                <div>
                  <input
                    type="checkbox"
                    checked={it.aplica}
                    onChange={() => toggle(i, "aplica")}
                  />
                </div>
                <div>
                  <input
                    type="checkbox"
                    checked={it.existe}
                    onChange={() => toggle(i, "existe")}
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={it.fecha || ""}
                    onChange={(e) => setItemField(i, "fecha", e.target.value)}
                  />
                </div>
                <div>
                  <input
                    type="url"
                    placeholder="https://… (opcional)"
                    value={it.verificador_url || ""}
                    onChange={(e) =>
                      setItemField(i, "verificador_url", e.target.value)
                    }
                  />
                </div>
              </div>
            );
          })}
      </div>

      {/* ===== Resumen ===== */}
      <div className="summary">
        <div>
          <b>Existencia:</b> {scoreEXI}/13 —{" "}
          <span
            className={"badge " + estadoExist.toLowerCase().replace(" ", "-")}
          >
            {estadoExist}
          </span>
        </div>
        <div>
          <b>Actualización:</b> {scoreACT}/3 —{" "}
          <span
            className={"badge " + estadoAct.toLowerCase().replace(" ", "-")}
          >
            {estadoAct}
          </span>
        </div>
      </div>

      <label>
        Observaciones
        <textarea
          value={form.observaciones}
          onChange={(e) =>
            setForm((p) => ({ ...p, observaciones: e.target.value }))
          }
          rows={3}
        />
      </label>

      <div className="actions">
        <button onClick={onClose} type="button" className="btn-cancel">
          Cancelar
        </button>
        <button onClick={submit} disabled={saving} className="btn-save">
          {saving ? "Guardando…" : "Guardar auditoría"}
        </button>
      </div>
    </div>
  );
}
