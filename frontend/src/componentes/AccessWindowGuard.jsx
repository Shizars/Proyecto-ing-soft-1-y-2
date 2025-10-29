// componentes/AccessWindowGuard.jsx
import { useEffect, useRef } from "react";
import { toast } from "react-toastify";

/**
 * Vigila una ventana horaria local (p. ej. 08:00–18:00).
 * - Muestra un aviso warnMinutes antes del cierre.
 * - Al llegar la hora de fin, ejecuta onTimeout() (p. ej. logout()).
 *
 * Súper simple: usa hora local del navegador.
 */
export default function AccessWindowGuard({
  start = "08:00", // HH:mm (24h)
  end = "18:00", // HH:mm (24h)
  warnMinutes = 5, // minutos antes para avisar
  onTimeout, // callback cuando cierra (e.g., logout)
}) {
  const warnedRef = useRef(false);
  const dayKeyRef = useRef("");

  // Convierte "HH:mm" a una fecha “hoy HH:mm”
  const todayAt = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    const now = new Date();
    const d = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      h,
      m,
      0,
      0
    );
    return d;
  };

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const startAt = todayAt(start);
      const endAt = todayAt(end);

      // Reset del “warned” al cambiar de día
      const key = now.toISOString().slice(0, 10) + `_${start}_${end}`;
      if (dayKeyRef.current !== key) {
        dayKeyRef.current = key;
        warnedRef.current = false;
      }

      // Si ya pasó la hora de fin ⇒ disparar timeout y parar
      if (now >= endAt) {
        if (onTimeout) {
          toast.info("⏰ Fin del horario permitido. Cerrando sesión…");
          // pequeño delay para que el toast se vea
          setTimeout(() => onTimeout(), 800);
        }
        return;
      }

      // Si estamos a warnMinutes del cierre ⇒ un solo aviso
      const msToEnd = endAt - now;
      const warnMs = warnMinutes * 60 * 1000;
      if (msToEnd <= warnMs && msToEnd > 0 && !warnedRef.current) {
        const mins = Math.max(1, Math.round(msToEnd / 60000));
        warnedRef.current = true;
        toast.warn(
          `⚠️ El sistema cerrará sesión en ~${mins} min (fin de horario).`,
          { autoClose: 7000 }
        );
      }
    };

    // Ejecutar ya y luego cada 10s (suficiente para este caso)
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, warnMinutes, onTimeout]);

  return null; // no renderiza UI
}
