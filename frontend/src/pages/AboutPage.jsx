import React from "react";
import "./AboutPage.css";
import {
  FaUserShield,
  FaUpload,
  FaSearch,
  FaLock,
  FaReact,
  FaPython,
  FaDatabase,
} from "react-icons/fa";
import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Portal de Gestión Documental</h1>
          <p>
            Optimiza el manejo, clasificación y seguridad de los documentos de
            la Fundación Ciudad del Niño a través de una plataforma moderna,
            colaborativa y confiable.
          </p>
          <Link to="/" className="btn-cta">
            Comienza ahora
          </Link>
        </div>
      </section>

      {/* Separador */}
      <div className="divider" />

      {/* Funcionalidades */}
      <section className="features">
        <h2>¿Qué puedes hacer?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <FaUserShield className="feature-icon" />
            <h3>Seguridad y Roles</h3>
            <p>Control de accesos, autenticación y autorización granular.</p>
          </div>
          <div className="feature-card">
            <FaUpload className="feature-icon" />
            <h3>Subida Inteligente</h3>
            <p>Clasificación automática y control de versiones.</p>
          </div>
          <div className="feature-card">
            <FaSearch className="feature-icon" />
            <h3>Búsqueda Avanzada</h3>
            <p>Filtra por fecha, categoría, etiquetas o contenido.</p>
          </div>
          <div className="feature-card">
            <FaLock className="feature-icon" />
            <h3>Auditoría</h3>
            <p>Registro completo de actividad y trazabilidad.</p>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Stack Tecnológico */}
      <section className="tech-stack">
        <h2>Stack Tecnológico</h2>
        <div className="stack-cards">
          <div className="stack-card">
            <FaReact className="stack-icon" />
            <span>React</span>
          </div>
          <div className="stack-card">
            <FaPython className="stack-icon" />
            <span>Flask</span>
          </div>
          <div className="stack-card">
            <FaDatabase className="stack-icon" />
            <span>PostgreSQL</span>
          </div>
          <div className="stack-card">
            <FaReact className="stack-icon" />
            <span>Formik &amp; Yup</span>
          </div>
        </div>
      </section>
    </div>
  );
}
