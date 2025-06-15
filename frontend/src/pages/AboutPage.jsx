import React, { useEffect } from "react";
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
import "./AboutPage.css";

export default function AboutPage() {
  /* ---------- Scroll-reveal ---------- */
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const onScroll = () => {
      els.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight - 120) {
          el.classList.add("visible");
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="about-page">
      {/* ---------- HERO CARD ---------- */}
      <section className="hero-card">
        <header className="hero-top">
          <span className="logo">Fundación Cuidad Del Niño</span>
        </header>

        {/* CUERPO */}
        <div className="hero-body">
          <div className="hero-text">
            <h1>
              Ofrecemos <span>soluciones inteligentes</span>
              <br /> para impulsar tu misión
            </h1>
            <p>
              Nuestra plataforma documental digitaliza, clasifica y protege la
              información crítica de la Fundación Ciudad del Niño, facilitando
              la colaboración y el acceso seguro desde cualquier lugar.
            </p>

            <div className="hero-btns">
              <Link to="/registro" className="btn-primary">
                Empezar
              </Link>
              <Link to="/proyecto" className="btn-outline">
                Saber más
              </Link>
            </div>
          </div>

          {/* IMAGEN */}
          <div className="hero-image">
            <img src={require("../img/FCDN.png")} alt="Equipo Fundación" />
          </div>
        </div>
      </section>

      {/* ---------- FUNCIONES ---------- */}
      <section className="features reveal">
        <h2>Funciones clave</h2>
        <div className="feature-grid">
          <Feature
            icon={<FaUserShield />}
            title="Seguridad y Roles"
            desc="Autenticación JWT y permisos granulares."
          />
          <Feature
            icon={<FaUpload />}
            title="Subida Inteligente"
            desc="Clasificación automática y versionado."
          />
          <Feature
            icon={<FaSearch />}
            title="Búsqueda Avanzada"
            desc="Filtrado por categoría, fecha o contenido."
          />
          <Feature
            icon={<FaLock />}
            title="Auditoría"
            desc="Historial completo de actividades."
          />
        </div>
      </section>

      {/* ---------- STACK ---------- */}
      <section className="stack reveal">
        <h2>Tecnologías</h2>
        <div className="stack-icons">
          <FaReact title="React" />
          <FaPython title="Flask" />
          <FaDatabase title="PostgreSQL" />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <article className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </article>
  );
}
