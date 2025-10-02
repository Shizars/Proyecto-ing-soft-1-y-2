import React, { useEffect, useRef, useState, useMemo } from "react";
import { rptRespPorProgramaV2 } from "../services/auditsV2";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import "./ProgramResponsesWidget.css";

export default function ProgramResponsesWidget({ refreshMs = 15000 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false); // ← flecha abre/cierra gráfico
  const timerRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await rptRespPorProgramaV2();
      setItems(
        [...data].sort((a, b) => (b.respuestas || 0) - (a.respuestas || 0))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState === "visible") await load();
    };
    tick();
    timerRef.current = setInterval(tick, Math.max(3000, refreshMs));
    return () => clearInterval(timerRef.current);
  }, [refreshMs]);

  const total = useMemo(
    () => items.reduce((acc, it) => acc + (it.respuestas || 0), 0),
    [items]
  );

  // Colores para ejes/leyendas según modo oscuro
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const axisColor = isDark ? "#e5e7eb" : "#374151";
  const gridColor = isDark ? "#374151" : "#e5e7eb";

  return (
    <div className={`prog-resp-widget ${open ? "open" : ""}`}>
      <div className="prw-head">
        <span className="prw-title">Respuestas por Programa - F-SGC-033</span>
        <div className="prw-actions">
          <span className="prw-total" title="Total respuestas">
            Total global {total}
          </span>
          <button
            className={`prw-toggle ${open ? "rot" : ""}`}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Ocultar gráfico" : "Mostrar gráfico"}
            title={open ? "Ocultar gráfico" : "Mostrar gráfico"}
            type="button"
          >
            ▾
          </button>
        </div>
      </div>

      {loading ? (
        <div className="prw-skeleton">
          <div className="line" />
          <div className="line" />
          <div className="line" />
        </div>
      ) : items.length === 0 ? (
        <div className="prw-empty">Sin datos aún.</div>
      ) : (
        <>
          <ul className="prw-list">
            {items.map(({ programa, respuestas }) => (
              <li key={programa} className="prw-item">
                <span className="prw-program">{programa || "—"}</span>
                <span className="prw-badge">{respuestas ?? 0}</span>
              </li>
            ))}
          </ul>

          {/* Contenedor colapsable del gráfico */}
          <div className={`prw-chart-wrap ${open ? "show" : ""}`}>
            <div className="prw-chart">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={items}
                  margin={{ top: 8, right: 8, bottom: 4, left: 8 }}
                >
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                  <XAxis dataKey="programa" stroke={axisColor} fontSize={12} />
                  <YAxis
                    stroke={axisColor}
                    fontSize={12}
                    allowDecimals={false}
                  />
                  <Tooltip
                    wrapperStyle={{ outline: "none" }}
                    contentStyle={{
                      background: isDark ? "#0f1521" : "#ffffff",
                      border: `1px solid ${gridColor}`,
                      borderRadius: 8,
                      fontSize: 12,
                      color: axisColor,
                    }}
                  />
                  <Bar dataKey="respuestas" fill="#6c63ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
