import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuth } from "../hooks/useAuth";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const { login } = useAuth();
  const [apiError, setApiError] = useState("");

  const schema = Yup.object({
    email: Yup.string().email("Email inválido").required("Requerido"),
    password: Yup.string().min(6, "Mínimo 6 caracteres").required("Requerido"),
  });

  return (
    <div className="login-page">
      {/* Panel izquierdo */}
      <div className="login-left">
        <img
          src={require("../img/cdn_docs.png")}
          alt="Fundación Ciudad del Niño"
          className="auth-logo"
        />
        <h1>¡Bienvenido al Portal de Gestión Documental!</h1>
        <p>
          Regístrate para acceder de forma segura y eficiente a todos los
          documentos de la Fundación Ciudad del Niño. Lleva el control de
          versiones, colabora con tu equipo y mantén la información siempre al
          día.
        </p>
      </div>

      {/* Panel derecho */}
      <div className="login-right">
        <h2>Iniciar Sesión</h2>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={schema}
          onSubmit={async (values, { setSubmitting }) => {
            setApiError("");
            try {
              await login(values.email, values.password); // llama al backend
              navigate("/dashboard"); // redirige al home
            } catch (err) {
              setApiError(
                err.response?.data?.error || "Credenciales inválidas"
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

              {apiError && <span className="error">{apiError}</span>}

              <button type="submit" className="btn" disabled={isSubmitting}>
                Entrar
              </button>
            </Form>
          )}
        </Formik>

        <p className="auth-nav">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
          <br />
          <Link to="/forgot-password" className="forgot-link">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </div>
    </div>
  );
}
