// src/componentes/Footer.jsx
import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-left">
          <p className="footer-copy">
            © {new Date().getFullYear()} Fundación Ciudad del Niño. Todos los
            derechos reservados.
          </p>
          <nav className="footer-nav">
            <a href="/términos" className="footer-link">
              Términos y condiciones
            </a>
            <span className="footer-divider">|</span>
            <a href="/privacidad" className="footer-link">
              Política de privacidad
            </a>
            <span className="footer-divider">|</span>
            <a href="/contacto" className="footer-link">
              Contacto
            </a>
          </nav>
        </div>

        <div className="footer-right">
          <a
            href="https://www.youtube.com/@fundacionciudaddelnino8462/videos"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-icon-link"
          >
            <img
              src="/icons/youtube.svg"
              alt="YouTube"
              className="footer-icon"
            />
          </a>
          <a
            href="https://web.facebook.com/fciudaddelninocl"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-icon-link"
          >
            <img
              src="/icons/facebook.svg"
              alt="Facebook"
              className="footer-icon"
            />
          </a>
          <a
            href="https://x.com/ciudaddelninocl"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-icon-link"
          >
            <img
              src="/icons/twitter.svg"
              alt="Twitter"
              className="footer-icon"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
