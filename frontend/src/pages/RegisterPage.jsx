// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import "./RegisterPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const auth = useAuth(); // ← hook de autenticación
  const [apiError, setApiError] = useState("");

  /* ---------- Validación ---------- */
  const schema = Yup.object({
    name: Yup.string().required("Requerido"),
    email: Yup.string().email("Email inválido").required("Requerido"),
    password: Yup.string().min(6, "Mínimo 6 caracteres").required("Requerido"),
    confirm: Yup.string()
      .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
      .required("Requerido"),
  });

  return (
    <div className="register-page">
      {/* Panel izquierdo */}
      <div className="register-left">
        <img
          src={require("../img/cdn_docs.png")}
          alt="Fundación Ciudad del Niño"
          className="auth-logo"
        />
        <h1>¡Bienvenido al Portal de Gestión Documental!</h1>
        <p>
          Regístrate para organizar, clasificar y acceder de forma segura y
          eficiente a todos los documentos de la Fundación Ciudad del Niño.
          Lleva el control de versiones, colabora con tu equipo y mantén la
          información siempre al día.
        </p>
      </div>

      {/* Panel derecho */}
      <div className="register-right">
        <h2>Crear Cuenta</h2>

        <Formik
          initialValues={{ name: "", email: "", password: "", confirm: "" }}
          validationSchema={schema}
          onSubmit={async (values, { setSubmitting }) => {
            setApiError("");
            try {
              /* 1️⃣ Crear usuario */
              await api.post("/auth/register", {
                nombre_usuario: values.name,
                email: values.email,
                password: values.password,
              });

              /* 2️⃣ Auto-login (guarda token + contexto) */
              await auth.login(values.email, values.password);

              /* 3️⃣ Redirigir al dashboard */
              navigate("/dashboard");
            } catch (err) {
              setApiError(
                err.response?.data?.error ||
                  "No se pudo crear la cuenta. Intenta de nuevo."
              );
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="auth-form">
              <div className="field-group">
                <Field name="name" type="text" placeholder="Nombre completo" />
                <div className="error-placeholder">
                  <ErrorMessage component="div" name="name" />
                </div>
              </div>

              <div className="field-group">
                <Field
                  name="email"
                  type="email"
                  placeholder="Correo electrónico"
                />
                <div className="error-placeholder">
                  <ErrorMessage component="div" name="email" />
                </div>
              </div>

              <div className="field-group">
                <Field
                  name="password"
                  type="password"
                  placeholder="Contraseña"
                />
                <div className="error-placeholder">
                  <ErrorMessage component="div" name="password" />
                </div>
              </div>

              <div className="field-group">
                <Field
                  name="confirm"
                  type="password"
                  placeholder="Repetir contraseña"
                />
                <div className="error-placeholder">
                  <ErrorMessage component="div" name="confirm" />
                </div>
              </div>

              {apiError && <span className="error">{apiError}</span>}

              <button type="submit" className="btn" disabled={isSubmitting}>
                Crear Cuenta
              </button>
            </Form>
          )}
        </Formik>

        <p className="auth-nav">
          ¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
