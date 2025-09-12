import React from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { createAuditV2 } from "../services/auditsV2";
import "./AuditFormV2.css";

const E3 = ["SI", "NO", "NC"];
const C2 = ["CUMPLE", "NO_CUMPLE"];

const Schema = Yup.object({
  programa: Yup.string().required("Requerido"),
  nombre_revisor: Yup.string().required("Requerido"),
});

const initialValues = {
  programa: "",
  nombre_revisor: "",
  fecha_revision: "",
  nombre_nna: "",
  fecha_ingreso: "",
  existence: {
    orden_ingreso: "NC",
    informe_derivacion: "NC",
    cert_nacimiento: "NC",
    carta_compromiso: "NC",
    ficha_ingreso: "NC",
    registro_actividades: "NC",
    puntaje_total: 0,
    calificacion_existencia: "NO_CUMPLE",
    observaciones_existencia: "",
  },
  updates: {
    pii_fecha_elab: "",
    pii_fecha_term: "",
    pii_actualizado: "NO",
    reg_act_ultima_fecha: "",
    reg_act_actualizado: "NO",
    tribunal_fecha_emision: "",
    tribunal_actualizado: "NC",
    calificacion_actualizacion: "NO_CUMPLE",
    observaciones_actualizacion: "",
  },
};

export default function AuditFormV2({ onSaved, onClose }) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={Schema}
      onSubmit={async (values, { resetForm }) => {
        await createAuditV2(values);
        if (onSaved) onSaved();
        resetForm();
      }}
    >
      {() => (
        <Form className="audit-form">
          <h2>Nueva Auditoría: F-SGC-033</h2>

          <label>Programa</label>
          <Field as="select" name="programa">
            <option value="">Seleccione…</option>
            <option>DAM</option>
            <option>PEE</option>
            <option>PIE</option>
            <option>PPF</option>
            <option>PRM</option>
            <option>PSA</option>
            <option>PLA</option>
            <option>PLE</option>
          </Field>

          <label>Nombre revisor</label>
          <Field name="nombre_revisor" />

          <label>Fecha revisión</label>
          <Field type="date" name="fecha_revision" />

          <label>Nombre NNA (Niño / Adolecente)</label>
          <Field name="nombre_nna" />

          <label>Fecha ingreso</label>
          <Field type="date" name="fecha_ingreso" />

          <hr />
          <h3>I. Existencia de documentos</h3>
          {[
            ["orden_ingreso", "Orden de Ingreso"],
            ["informe_derivacion", "Informe de Derivación"],
            ["cert_nacimiento", "Certificado de Nacimiento"],
            ["carta_compromiso", "Carta Compromiso"],
            ["ficha_ingreso", "Ficha de Ingreso"],
            ["registro_actividades", "Registro de Actividades"],
          ].map(([k, label]) => (
            <div key={k} className="radio-row">
              <span>{label}</span>
              {E3.map((opt) => (
                <label key={opt}>
                  <Field type="radio" name={`existence.${k}`} value={opt} />{" "}
                  {opt}
                </label>
              ))}
            </div>
          ))}

          <label>Puntaje total</label>
          <Field type="number" name="existence.puntaje_total" min="0" />

          <div className="radio-row">
            <span>Calificación existencia</span>
            {C2.map((opt) => (
              <label key={opt}>
                <Field
                  type="radio"
                  name="existence.calificacion_existencia"
                  value={opt}
                />{" "}
                {opt}
              </label>
            ))}
          </div>

          <label>Observaciones</label>
          <Field as="textarea" name="existence.observaciones_existencia" />

          <hr />
          <h3>
            II. Actualización de documentos: Registrar fecha y marcar
            alternativa correspodiente.
          </h3>
          <label>PII elaborado</label>
          <Field type="date" name="updates.pii_fecha_elab" />

          <label>PII término</label>
          <Field type="date" name="updates.pii_fecha_term" />

          <div className="radio-row">
            <span>¿El plan de intervención individual está actualizado?</span>
            {["SI", "NO"].map((o) => (
              <label key={o}>
                <Field type="radio" name="updates.pii_actualizado" value={o} />{" "}
                {o}
              </label>
            ))}
          </div>

          <label>Última fecha registro actividades</label>
          <Field type="date" name="updates.reg_act_ultima_fecha" />

          <div className="radio-row">
            <span>Registro actualizado</span>
            {["SI", "NO"].map((o) => (
              <label key={o}>
                <Field
                  type="radio"
                  name="updates.reg_act_actualizado"
                  value={o}
                />{" "}
                {o}
              </label>
            ))}
          </div>

          <label>Informe tribunal fecha</label>
          <Field type="date" name="updates.tribunal_fecha_emision" />

          <div className="radio-row">
            <span>Tribunal actualizado</span>
            {E3.map((o) => (
              <label key={o}>
                <Field
                  type="radio"
                  name="updates.tribunal_actualizado"
                  value={o}
                />{" "}
                {o}
              </label>
            ))}
          </div>

          <div className="radio-row">
            <span>Calificación actualización</span>
            {C2.map((o) => (
              <label key={o}>
                <Field
                  type="radio"
                  name="updates.calificacion_actualizacion"
                  value={o}
                />{" "}
                {o}
              </label>
            ))}
          </div>

          <label>Observaciones</label>
          <Field as="textarea" name="updates.observaciones_actualizacion" />

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
