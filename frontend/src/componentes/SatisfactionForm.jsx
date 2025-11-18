import React from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { createSatisfaction } from "../services/satisfaction";
import "./SatisfactionForm.css";

const RESP_EN = ["Sede", "Terreno"];
const SAT = ["Satisfecho(a)", "Insatisfecho(a)"];
const RESULTADOS = [
  "Han mejorado las relaciones con mi familia",
  "Me siento mejor, estoy contento, feliz",
  "Me siento apoyado por mi familia",
  "Me tratan bien, no me castigan",
  "Estoy más responsable",
  "He tenido cambios positivos",
  "Me siento más seguro",
  "Se respetan mis derechos",
  "Hay más comunicación en mi familia",
  "Me siento menos culpable",
  "Me estoy portando mejor",
  "No he tenido ningún cambio",
];

/** Pasa la lista de programas por props  */
const Schema = Yup.object({
  respondida_en: Yup.string().required("Requerido"),
  programa: Yup.string().required("Requerido"),
  p1_trato: Yup.string().required("Requerido"),
  p2_info: Yup.string().required("Requerido"),
  p3_tiempo: Yup.string().required("Requerido"),
  p4_participacion: Yup.string().required("Requerido"),
  p5_resultados: Yup.string().required("Requerido"),
  p6_infraestructura: Yup.string().required("Requerido"),

  // mínimo 1 resultado marcado
  resultados_percibidos: Yup.array()
    .of(Yup.string())
    .min(1, "Debes marcar al menos una opción."),

  // firma obligatoria
  firma_nna: Yup.string()
    .trim()
    .required("La firma del niño(a) es obligatoria"),
});

export default function SatisfactionForm({ onSaved, onClose, programas = [] }) {
  const initialValues = {
    respondida_en: "",
    programa: "",
    nombre_nna: "",
    responsable_aplicacion: "",
    fecha_aplicacion: "",
    p1_trato: "Satisfecho(a)",
    p2_info: "Satisfecho(a)",
    p3_tiempo: "Satisfecho(a)",
    p4_participacion: "Satisfecho(a)",
    p5_resultados: "Satisfecho(a)",
    p6_infraestructura: "Satisfecho(a)",
    observaciones: "",
    resultados_percibidos: [],
    firma_nna: "",
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={Schema}
      onSubmit={async (values, { resetForm, setSubmitting, setStatus }) => {
        setStatus(undefined);
        try {
          await createSatisfaction(values);
          resetForm();
          onSaved && onSaved();
        } catch (err) {
          console.error("save satisfaction error:", err?.response || err);
          const msg =
            err?.response?.data?.error ||
            err?.response?.data?.detail ||
            "No se pudo guardar la encuesta. Revisa que todos los campos obligatorios estén completos.";

          setStatus({ apiError: msg });
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({
        values,
        setFieldValue,
        errors,
        touched,
        status,        // 👈 NUEVO
        submitCount,   // 👈 NUEVO
      }) => (
        <Form className="satisf-form">
          <h2>Encuesta de Satisfacción (NNA)</h2>

          {/* error general de API */}
          {status?.apiError && (
            <div className="error" style={{ marginBottom: 8 }}>
              {status.apiError}
            </div>
          )}

          <div className="grid-2">
            <div>
              <label>Respondida en *</label>
              <Field as="select" name="respondida_en">
                <option value="">Seleccione…</option>
                {RESP_EN.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Field>
              {touched.respondida_en && errors.respondida_en && (
                <div className="error">{errors.respondida_en}</div>
              )}
            </div>

            <div>
              <label>Nombre del Programa *</label>
              <Field as="select" name="programa">
                <option value="">Seleccione…</option>
                {programas.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Field>
              {touched.programa && errors.programa && (
                <div className="error">{errors.programa}</div>
              )}
            </div>
          </div>

          <div className="grid-2">
            <div>
              <label>Nombre del niño(a)</label>
              <Field name="nombre_nna" />
            </div>
            <div>
              <label>Responsable de la aplicación</label>
              <Field name="responsable_aplicacion" />
            </div>
          </div>

          <div className="grid-2">
            <div>
              <label>Fecha de aplicación</label>
              <Field type="date" name="fecha_aplicacion" />
            </div>
            <div />
          </div>

          <hr />
          <h3>I. Satisfacción</h3>

          {[
            ["p1_trato", "1. Trato recibido por los profesionales del equipo"],
            [
              "p2_info",
              "2. Información entregada por el personal del proyecto",
            ],
            [
              "p3_tiempo",
              "3. Tiempo de respuesta a tus demandas/requerimientos",
            ],
            [
              "p4_participacion",
              "4. Posibilidad de participar en el proceso de intervención",
            ],
            ["p5_resultados", "5. Resultados al finalizar tu participación"],
            [
              "p6_infraestructura",
              "6. Infraestructura y equipamiento del centro",
            ],
          ].map(([k, label]) => (
            <div className="radio-row" key={k}>
              <span>{label}</span>
              {SAT.map((opt) => (
                <label key={opt} className="chip">
                  <Field type="radio" name={k} value={opt} /> {opt}
                </label>
              ))}
            </div>
          ))}

          <label>
            Observaciones: Para aquellas opciones evaluadas en insatisfecho (a).{" "}
          </label>
          <Field as="textarea" name="observaciones" />

          <hr />
          <h3>
            II. Resultados percibidos: Cual de estas alternativas tu crees que
            se identifica mejor con los resultados que has tenido (puedes marcar
            más de una).
          </h3>
          <div className="section-card">
            {RESULTADOS.map((opt) => {
              const checked = values.resultados_percibidos.includes(opt);
              return (
                <label
                  key={opt}
                  className={`check-item ${checked ? "on" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const arr = new Set(values.resultados_percibidos);
                      e.target.checked ? arr.add(opt) : arr.delete(opt);
                      setFieldValue("resultados_percibidos", Array.from(arr));
                    }}
                  />
                  {opt}
                </label>
              );
            })}
          </div>

          {/* error para resultados_percibidos */}
          {(touched.resultados_percibidos || submitCount > 0) &&
            errors.resultados_percibidos && (
              <div className="error">{errors.resultados_percibidos}</div>
            )}

          <label>Firma del niño(a)</label>
          <Field name="firma_nna" placeholder="Nombre / Iniciales" />
          {(touched.firma_nna || submitCount > 0) && errors.firma_nna && (
            <div className="error">{errors.firma_nna}</div>
          )}

          <div className="actions">
            <button type="submit">Guardar</button>
            {onClose && (
              <button type="button" onClick={onClose}>
                Cerrar
              </button>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
}
