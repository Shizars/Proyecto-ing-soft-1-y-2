// src/pages/ResetPasswordPage.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import api from "../services/api";
import "./AuthPages.css";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const schema = Yup.object({
    password: Yup.string().min(6, "Mínimo 6 caracteres").required("Requerido"),
    confirm: Yup.string()
      .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
      .required("Requerido"),
  });

  return (
    <div className="auth-page">
      <h2>Restablecer contraseña</h2>
      <Formik
        initialValues={{ password: "", confirm: "" }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          setError("");
          try {
            const res = await api.post("/auth/reset-password", {
              token,
              password: values.password,
            });
            setMessage(res.data.msg);
            setTimeout(() => navigate("/"), 3000);
          } catch (err) {
            setError(
              err.response?.data?.error || "Error al restablecer contraseña."
            );
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="auth-form">
            <div className="field-group">
              <Field
                name="password"
                type="password"
                placeholder="Nueva contraseña"
              />
              <ErrorMessage
                component="span"
                name="password"
                className="error"
              />
            </div>
            <div className="field-group">
              <Field
                name="confirm"
                type="password"
                placeholder="Confirmar contraseña"
              />
              <ErrorMessage component="span" name="confirm" className="error" />
            </div>

            {message && <div className="success">{message}</div>}
            {error && <div className="error">{error}</div>}

            <button type="submit" className="btn" disabled={isSubmitting}>
              Restablecer contraseña
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
