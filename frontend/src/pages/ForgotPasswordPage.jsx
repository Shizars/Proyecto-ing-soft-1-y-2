// src/pages/ForgotPasswordPage.jsx
import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import api from "../services/api";
import "./AuthPages.css";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const schema = Yup.object({
    email: Yup.string().email("Email inválido").required("Requerido"),
  });

  return (
    <div className="auth-page">
      <h2>Recuperar contraseña</h2>
      <p>Ingresa tu email para recibir las instrucciones de recuperación.</p>
      <Formik
        initialValues={{ email: "" }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          setError("");
          try {
            const res = await api.post("/auth/forgot-password", {
              email: values.email,
            });
            setMessage(res.data.msg);
          } catch (err) {
            setError(
              err.response?.data?.error || "Error al enviar instrucciones."
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
                name="email"
                type="email"
                placeholder="Correo electrónico"
              />
              <ErrorMessage component="span" name="email" className="error" />
            </div>

            {message && <div className="success">{message}</div>}
            {error && <div className="error">{error}</div>}

            <button type="submit" className="btn" disabled={isSubmitting}>
              Enviar instrucciones
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
