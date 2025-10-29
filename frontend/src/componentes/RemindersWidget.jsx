import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  addReminder,
  getReminders,
  deleteReminderApi,
  markReminderDone,
} from "../services/api";

/**
 * Widget simple de recordatorios:
 * - Crear recordatorio (título + fecha/hora local).
 * - Listar próximos y permitir marcar como hecho o eliminar.
 * - Checker cada 30s: si vence, muestra toast y notificación del navegador.
 */
export default function RemindersWidget() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState(""); // datetime-local
  const notifiedRef = useRef(
    new Set(JSON.parse(localStorage.getItem("notifiedReminders") || "[]"))
  );

  const saveNotified = () => {
    localStorage.setItem(
      "notifiedReminders",
      JSON.stringify(Array.from(notifiedRef.current))
    );
  };

  const load = async () => {
    try {
      const { data } = await getReminders();
      setItems(data);
    } catch (e) {
      console.error(e);
      toast.error("No se pudieron cargar los recordatorios");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Pedir permiso de notificación (opcional)
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // ✅ Helper: genera "-03:00", "+02:00", etc. según la zona local actual
  const buildLocalOffset = () => {
    // getTimezoneOffset devuelve minutos al OESTE de UTC; invertimos para obtener ESTE (+)
    const minutesEast = -new Date().getTimezoneOffset();
    const sign = minutesEast >= 0 ? "+" : "-";
    const abs = Math.abs(minutesEast);
    const hh = String(Math.floor(abs / 60)).padStart(2, "0");
    const mm = String(abs % 60).padStart(2, "0");
    return `${sign}${hh}:${mm}`;
  };

  // Chequeo cada 30s
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      items.forEach((r) => {
        if (r.done) return;
        const due = Date.parse(r.due_at);
        if (!isNaN(due) && now >= due && !notifiedRef.current.has(r.id)) {
          notifiedRef.current.add(r.id);
          saveNotified();

          // Toast
          toast.info(`🔔 Recordatorio: ${r.title}`);

          // Notificación nativa
          try {
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("Recordatorio", { body: r.title });
            }
          } catch {}
        }
      });
    };
    const id = setInterval(tick, 30000);
    // primera pasada
    tick();
    return () => clearInterval(id);
  }, [items]);

  const upcoming = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => new Date(a.due_at) - new Date(b.due_at));
    return arr;
  }, [items]);

  const onAdd = async (e) => {
    e.preventDefault();
    if (!title.trim() || !when) {
      toast.warn("Completa título y fecha/hora");
      return;
    }

    // ⛔ No convertir a UTC. ✅ Adjuntar offset local al valor "YYYY-MM-DDTHH:mm"
    const offset = buildLocalOffset(); // p.ej. "-03:00" en Chile
    const withSeconds = when.length === 16 ? `${when}:00` : when; // asegura segundos
    const due_at = `${withSeconds}${offset}`; // "2025-10-29T00:29:00-03:00"

    try {
      await addReminder({ title: title.trim(), due_at });
      setTitle("");
      setWhen("");
      await load();
      toast.success("Recordatorio creado");
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || "No se pudo crear");
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Eliminar recordatorio?")) return;
    try {
      await deleteReminderApi(id);
      notifiedRef.current.delete(id);
      saveNotified();
      await load();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar");
    }
  };

  const onDoneToggle = async (r) => {
    try {
      await markReminderDone(r.id, !r.done);
      if (!r.done) {
        // si lo marcamos hecho, evitamos futuras notificaciones
        notifiedRef.current.add(r.id);
        saveNotified();
      }
      await load();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo actualizar");
    }
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 8 }}>Recordatorios</h3>

      <form
        onSubmit={onAdd}
        className="reminders-form"
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "1fr auto auto",
        }}
      >
        <input
          placeholder="Título (ej. Reunión PRM)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          title="Fecha y hora"
        />
        <button type="submit">Añadir</button>
      </form>

      <ul
        style={{
          marginTop: 12,
          display: "grid",
          gap: 8,
          listStyle: "none",
          padding: 0,
        }}
      >
        {upcoming.length === 0 && (
          <li style={{ color: "#888" }}>No hay recordatorios.</li>
        )}
        {upcoming.map((r) => {
          const due = new Date(r.due_at);
          const past = Date.now() >= +due && !r.done;
          return (
            <li
              key={r.id}
              className="reminder-row"
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto auto",
                alignItems: "center",
                gap: 8,
              }}
            >
              <input
                type="checkbox"
                checked={r.done}
                onChange={() => onDoneToggle(r)}
                title={r.done ? "Marcar como pendiente" : "Marcar como hecho"}
              />
              <div>
                <div style={{ fontWeight: 600, opacity: r.done ? 0.6 : 1 }}>
                  {r.title}
                </div>
                <div style={{ fontSize: 12, color: past ? "#b00020" : "#666" }}>
                  {due.toLocaleString()}
                  {past && !r.done ? " • vencido" : ""}
                </div>
              </div>
              <button
                onClick={() => onDoneToggle(r)}
                title={r.done ? "Desmarcar" : "Marcar hecho"}
              >
                {r.done ? "Desmarcar" : "Hecho"}
              </button>
              <button
                className="danger"
                onClick={() => onDelete(r.id)}
                title="Eliminar"
              >
                Eliminar
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
