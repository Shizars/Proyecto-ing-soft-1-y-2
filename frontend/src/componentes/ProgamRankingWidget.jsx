import React, { useEffect, useRef, useState } from "react";
import { rptRankingProgramasV2 } from "../services/auditsV2";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import "./ProgramRankingWidget.css";

export default function ProgramRankingWidget({ refreshMs = 15000 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [asc, setAsc] = useState(false); // orden asc/desc
  const [open, setOpen] = useState(false); // mostrar/ocultar gráfico
  const [useAvg, setUseAvg] = useState(false); // suma (false) / promedio (true)
  const timerRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await rptRankingProgramasV2(useAvg); // devuelve [{ programa, puntaje, n }]
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  // carga inicial + auto-refresh (pausa en segundo plano)
  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState === "visible") await load();
    };
    tick();
    timerRef.current = setInterval(tick, Math.max(3000, refreshMs));
    return () => clearInterval(timerRef.current);
  }, [refreshMs, useAvg]); // recargar si cambia Suma/Promedio

  // ordenar según estado asc/desc usando 'puntaje'
  const sortedItems = [...items].sort((a, b) =>
    asc ? a.puntaje - b.puntaje : b.puntaje - a.puntaje
  );

  // colores según tema
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const axisColor = isDark ? "#e5e7eb" : "#374151";
  const gridColor = isDark ? "#374151" : "#e5e7eb";

  // paleta por programa
  const colors = {
    PEE: "#6c63ff",
    PIE: "#16a34a",
    PRM: "#f59e0b",
    DAM: "#ef4444",
    PPF: "#3b82f6",
    PSA: "#8b5cf6",
    PLA: "#10b981",
    PLE: "#f472b6",
  };

  return (
    <div className={`prog-rank-widget ${open ? "open" : ""}`}>
      <div className="prw-head">
        <span className="prw-title">Ranking por Puntaje : F-SGC-033</span>
        <div className="prw-actions">
          {/* Toggle Suma/Promedio */}
          <button
            className="prw-mode"
            type="button"
            onClick={() => setUseAvg((v) => !v)}
            title={useAvg ? "Cambiar a Suma" : "Cambiar a Promedio"}
          >
            {useAvg ? "AVG" : "SUM"}
          </button>

          {/* Orden asc/desc */}
          <button
            className="prw-sort"
            onClick={() => setAsc((a) => !a)}
            type="button"
            title={`Ordenar ${asc ? "descendente" : "ascendente"}`}
          >
            {asc ? "↑" : "↓"}
          </button>

          {/* Mostrar/ocultar gráfico */}
          <button
            className={`prw-toggle ${open ? "rot" : ""}`}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Ocultar gráfico" : "Mostrar gráfico"}
            type="button"
            title={open ? "Ocultar gráfico" : "Mostrar gráfico"}
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
      ) : sortedItems.length === 0 ? (
        <div className="prw-empty">Sin datos aún.</div>
      ) : (
        <>
          {/* Lista compacta */}
          <ul className="prw-list">
            {sortedItems.map(({ programa, puntaje }) => (
              <li key={programa} className="prw-item">
                <span className="prw-program">{programa || "—"}</span>
                <span className="prw-badge">
                  {puntaje != null ? Number(puntaje).toFixed(0) : 0}
                </span>
              </li>
            ))}
          </ul>

          {/* Gráfico colapsable */}
          <div className={`prw-chart-wrap ${open ? "show" : ""}`}>
            <div className="prw-chart">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={sortedItems}
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
                    formatter={(value) => [Number(value).toFixed(0), "Puntaje"]}
                  />
                  <Bar dataKey="puntaje" fill={isDark ? "#8b8cfb" : "#6c63ff"}>
                    {sortedItems.map((entry, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={
                          colors[entry.programa] ||
                          (isDark ? "#9ca3af" : "#9ca3af")
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
