import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="cdn-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img
            src={require("../img/logo_cdn_2019.png")}
            alt="Fundación Ciudad del Niño"
          />
        </div>

        {/* columnas de enlaces */}
        <div className="footer-cols">
          <ul>
            <li className="foot-title">Info</li>
            <li>
              <a href="/proyecto">Acerca de</a>
            </li>
            <li>
              <a href="https://www.ciudaddelnino.cl/">Web oficial</a>
            </li>
          </ul>

          <ul>
            <li className="foot-title">Recursos</li>
            <li>
              <a href="#">Preguntas frecuentes</a>
            </li>
            <li>
              <a href="#">Guía rápida</a>
            </li>
          </ul>

          <ul>
            <li className="foot-title">Compañía</li>
            <li>
              <a href="#">Política de privacidad</a>
            </li>
            <li>
              <a href="#">Términos de uso</a>
            </li>
          </ul>
        </div>

        {/* newsletter y redes */}
        <div className="footer-news">
          <span className="foot-title">Mantente al día</span>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              /* …aquí iría tu lógica de suscripción… */
            }}
          >
            <input placeholder="Tu correo…" />
            <button>Suscribir</button>
          </form>

          <div className="foot-social">
            <a
              href="https://www.youtube.com/@fundacionciudaddelnino8462/videos"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
            >
              <img src={require("../img/youtube.png")} alt="" />
            </a>
            <a
              href="https://web.facebook.com/fciudaddelninocl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <img src={require("../img/facebook.png")} alt="" />
            </a>
            <a
              href="https://x.com/ciudaddelninocl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
            >
              <img src={require("../img/twitter.png")} alt="" />
            </a>
          </div>
        </div>
      </div>

      {/* franja inferior */}
      <div className="footer-copy">
        © 2025 Fundación Ciudad del Niño. Todos los derechos reservados.
      </div>
    </footer>
  );
}
