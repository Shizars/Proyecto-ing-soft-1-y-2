// src/componentes/Header.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import "./Header.css";

function Header() {
  const { pathname } = useLocation();
  // Oculta Header en el Dashboard
  if (pathname === "/dashboard") return null;

  return (
    <>
      {/* Barra superior con redes */}
      <div className="top-bar">
        <div className="top-bar-content">
          <div className="social-icons">
            <a
              href="https://www.youtube.com/@fundacionciudaddelnino8462/videos"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
            >
              <img
                src={require("../img/youtube.png")}
                alt="YouTube"
                className="icon-img"
              />
            </a>
            <a
              href="https://web.facebook.com/fciudaddelninocl?_rdc=1&_rdr#"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
            >
              <img
                src={require("../img/facebook.png")}
                alt="Facebook"
                className="icon-img"
              />
            </a>
            <a
              href="https://x.com/ciudaddelninocl"
              className="social-icon"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={require("../img/twitter.png")}
                alt="Twitter"
                className="icon-img"
              />
            </a>
            <a
              href="https://www.instagram.com/fundacionciudaddelnino/?hl=es-la"
              className="social-icon"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={require("../img/instagram.png")}
                alt="Instagram"
                className="icon-img"
              />
            </a>
          </div>
        </div>
      </div>

      <header className="header-container">
        <div className="header-content">
          {/* Logo */}
          <div className="header-left">
            <a href="/">
              <img
                src={require("../img/logo_cdn_2019.png")}
                alt="Logo Fundación"
                className="logo"
              />
            </a>
          </div>

          {/* Navegación */}
          <nav className="header-center">
            <a href="/" className="nav-link">
              Inicio
            </a>
            <a href="/proyecto" className="nav-link">
              Acerca de
            </a>
            <a
              href="https://www.ciudaddelnino.cl/"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
            >
              Fundación
            </a>
          </nav>

          <div className="header-right" />
        </div>
      </header>
    </>
  );
}

export default Header;
