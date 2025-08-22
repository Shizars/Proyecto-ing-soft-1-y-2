import React, { useState } from "react";
import { createSurvey } from "../services/api";
import "./SurveyForm.css";

const PREGUNTAS = [
  ["Q1", "Respecto del trato recibido…"],
  ["Q2", "Respecto de la información entregada…"],
  ["Q3", "Tiempo de respuesta a tus demandas…"],
  ["Q4", "Participación en el proceso de intervención…"],
  ["Q5", "Resultados obtenidos al finalizar…"],
  ["Q6", "Infraestructura y equipamiento del centro…"],
  ["Q7", "¿Ha percibido algún cambio positivo?"],
];

export default function SurveyForm({ onSaved, onClose }) {
  const [meta, setMeta] = useState({
    sede: "Sede",
    programa: "",
    respondido_por: "nna",
    nombre_respondiente: "",
    nombre_aplicador: "",
    fecha_aplicacion: new Date().toISOString().slice(0, 10),
    quiere_responder: true,
    motivo_no_responde: "",
  });
  const [resp, setResp] = useState(
    Object.fromEntries(PREGUNTAS.map(([k]) => [k, null]))
  );
  const [saving, setSaving] = useState(false);

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const answers = Object.entries(resp).map(([codigo, valor]) => ({
        codigo,
        valor,
      }));
      await createSurvey({ ...meta, answers });
      onSaved?.();
      onClose?.();
    } catch (err) {
      alert("No se pudo guardar");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const setR = (k, v) => setResp((p) => ({ ...p, [k]: v }));

  return (
    <form className="survey-form" onSubmit={guardar}>
      <h2>Encuesta de Satisfacción Usuaria</h2>

      <div className="grid6">
        {/* campos de cabecera, sólo muestro dos de ejemplo */}
        <label>
          Sede
          <select
            value={meta.sede}
            onChange={(e) => setMeta({ ...meta, sede: e.target.value })}
          >
            <option>Sede</option>
            <option>Terreno</option>
          </select>
        </label>
        <label>
          Programa
          <input
            value={meta.programa}
            onChange={(e) => setMeta({ ...meta, programa: e.target.value })}
          />
        </label>
        {/* …otros metadatos… */}
      </div>

      <table>
        <thead>
          <tr>
            <th>Pregunta</th>
            <th>Insatisfecho</th>
            <th>Satisfecho</th>
          </tr>
        </thead>
        <tbody>
          {PREGUNTAS.map(([k, txt]) => (
            <tr key={k}>
              <td>{txt}</td>
              <td>
                <input
                  type="radio"
                  name={k}
                  onChange={() => setR(k, "insatisfecho")}
                />
              </td>
              <td>
                <input
                  type="radio"
                  name={k}
                  onChange={() => setR(k, k === "Q7" ? "si" : "satisfecho")}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="actions">
        <button type="button" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" disabled={saving}>
          Guardar
        </button>
      </div>
    </form>
  );
}
