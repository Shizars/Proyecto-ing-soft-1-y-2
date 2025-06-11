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
          <Link to="/registro" className="btn-cta">
            Comienza ahora
          </Link>
        </div>
      </section>

      {/* Sobre el proyecto */}
      <section className="about-project">
        <div className="project-box">
          <h2>¿En qué consiste?</h2>
          <p>
            El sistema centraliza todos los documentos de la Fundación en una
            única plataforma digital. Permite:
          </p>
          <ul>
            <li>
              <strong>Acceso seguro</strong> mediante autenticación con roles.
            </li>
            <li>
              <strong>Control de versiones</strong> y trazabilidad de cambios.
            </li>
            <li>
              <strong>Búsqueda</strong> por palabras clave, categoría o fecha.
            </li>
            <li>
              <strong>Reportes</strong> y métricas para el equipo directivo.
            </li>
          </ul>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="features">
        <h2>Funciones clave</h2>
        <div className="feature-grid">
          <Feature
            icon={<FaUserShield />}
            title="Seguridad y Roles"
            desc="Control de accesos, autenticación y autorización granular."
          />
          <Feature
            icon={<FaUpload />}
            title="Subida Inteligente"
            desc="Clasificación automática y control de versiones."
          />
          <Feature
            icon={<FaSearch />}
            title="Búsqueda Avanzada"
            desc="Filtra por fecha, categoría, etiquetas o contenido."
          />
          <Feature
            icon={<FaLock />}
            title="Auditoría"
            desc="Registro completo de actividad y trazabilidad."
          />
        </div>
      </section>

      {/* Stack pequeño “Powered by” */}
      <section className="powered">
        <span>Powered&nbsp;by&nbsp;</span>
        <FaReact className="pow-icon" title="React" />
        <FaPython className="pow-icon" title="Flask" />
        <FaDatabase className="pow-icon" title="PostgreSQL" />
      </section>
    </div>
  );
}

/* Pequeño componente para no repetir */
function Feature({ icon, title, desc }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}
