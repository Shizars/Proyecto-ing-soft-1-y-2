import React from "react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-left">
          <p>
            © {new Date().getFullYear()} Fundación Ciudad del Niño. Todos los
            derechos reservados.
          </p>
        </div>

        <div className="footer-right">
          <a
            href="https://www.youtube.com/@fundacionciudaddelnino8462/videos"
            target="_blank"
            rel="noopener noreferrer"
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

export default Footer;
