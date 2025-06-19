import React, { useState, useEffect, useCallback } from "react";

/* 30 min = 1 800 s ─ cámbialo si quieres otro tiempo */
const SESSION_SECONDS = 30 * 60;

/* ------ formatea mm:ss ------ */
const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
    2,
    "0"
  )}`;

export default function SessionTimer({ onTimeout }) {
  const [secLeft, setSecLeft] = useState(SESSION_SECONDS);

  /* callback que reinicia la cuenta */
  const reset = useCallback(() => setSecLeft(SESSION_SECONDS), []);

  /*  cuenta atrás cada segundo */
  useEffect(() => {
    const id = setInterval(() => setSecLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, []);

  /* ↓ detecta actividad para reiniciar */
  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, reset));
    return () => events.forEach((ev) => window.removeEventListener(ev, reset));
  }, [reset]);

  /* ↓ cuando llega a 0 → cierra sesión */
  useEffect(() => {
    if (secLeft <= 0) {
      alert("Sesión expirada por inactividad.");
      onTimeout?.();
    }
  }, [secLeft, onTimeout]);

  return <div className="session-timer">⏱ {fmt(secLeft)}</div>;
}
