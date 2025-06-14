import React from "react";
import { FaYoutube, FaFacebookF, FaXTwitter } from "react-icons/fa6"; // usa FaTwitter si tu versión de react-icons es < 4.10
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-main">
        {/* ---------- Marca ---------- */}
        <div className="footer-brand">
          <img
            src="/logo-green.svg"
            alt="Fundación Ciudad del Niño"
            className="footer-logo"
          />
          <p className="footer-claim">
            Por la protección y desarrollo de los niños y niñas de Chile.
          </p>
        </div>

        {/* ---------- Columnas ---------- */}
        <div className="footer-columns">
          <div className="footer-col">
            <h4 className="footer-heading">Info</h4>
            <a href="/formatos" className="footer-link">
              Formatos
            </a>
            <a href="/faq" className="footer-link">
              Preguntas frecuentes
            </a>
            <a href="/estado" className="footer-link">
              Estado
            </a>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Recursos</h4>
            <a href="/herramientas" className="footer-link">
              Herramientas
            </a>
            <a href="/blog" className="footer-link">
              Blog
            </a>
            <a href="/documentacion" className="footer-link">
              Documentación
            </a>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Compañía</h4>
            <a href="/acerca" className="footer-link">
              Acerca de
            </a>
            <a href="/sustentabilidad" className="footer-link">
              Sustentabilidad
            </a>
            <a href="/privacidad" className="footer-link">
              Privacidad
            </a>
          </div>

          {/* ---------- Newsletter + RRSS ---------- */}
          <div className="footer-col footer-newsletter">
            <h4 className="footer-heading">Suscríbete</h4>
            <form
              className="footer-form"
              onSubmit={(e) => {
                e.preventDefault();
                /* integra tu servicio aquí */
              }}
            >
              <input
                type="email"
                required
                placeholder="Tu email"
                className="footer-input"
              />
              <button type="submit" className="footer-btn">
                Suscribir
              </button>
            </form>

            <div className="footer-social">
              <a
                href="https://www.youtube.com/@fundacionciudaddelnino8462/videos"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="footer-social-link"
              >
                <FaYoutube />
              </a>
              <a
                href="https://web.facebook.com/fciudaddelninocl"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="footer-social-link"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://x.com/ciudaddelninocl"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="footer-social-link"
              >
                <FaXTwitter />{" "}
                {/* Cambia por <FaTwitter /> si fuese necesario */}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © {year} Fundación Ciudad del Niño. Todos los derechos reservados.
      </div>
    </footer>
  );
}
