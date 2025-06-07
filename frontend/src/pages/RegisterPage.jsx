import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "./RegisterPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();

  // Esquema de validación Yup
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
          src={require("../img/banner_cdn.png")}
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

      {/* Panel derecho: formulario */}
      <div className="register-right">
        <h2>Crear Cuenta</h2>

        <Formik
          initialValues={{ name: "", email: "", password: "", confirm: "" }}
          validationSchema={schema}
          onSubmit={(values) => {
            console.log("Register values:", values);
            // TODO: llamar a la API Flask y manejar respuesta
            navigate("/login");
          }}
        >
          {() => (
            <Form className="auth-form">
              {/* Nombre */}
              <div className="field-group">
                <Field name="name" type="text" placeholder="Nombre completo" />
                <ErrorMessage component="span" name="name" className="error" />
              </div>

              {/* Email */}
              <div className="field-group">
                <Field
                  name="email"
                  type="email"
                  placeholder="Correo electrónico"
                />
                <ErrorMessage component="span" name="email" className="error" />
              </div>

              {/* Contraseña */}
              <div className="field-group">
                <Field
                  name="password"
                  type="password"
                  placeholder="Contraseña"
                />
                <ErrorMessage
                  component="span"
                  name="password"
                  className="error"
                />
              </div>

              {/* Confirmar contraseña */}
              <div className="field-group">
                <Field
                  name="confirm"
                  type="password"
                  placeholder="Repetir contraseña"
                />
                <ErrorMessage
                  component="span"
                  name="confirm"
                  className="error"
                />
              </div>

              <button type="submit" className="btn">
                Crear Cuenta
              </button>
            </Form>
          )}
        </Formik>

        <p className="auth-nav">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
