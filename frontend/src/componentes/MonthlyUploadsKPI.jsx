// src/componentes/MonthlyUploadsKPI.jsx
import React, { useMemo } from "react";

/**
 * KPI de subidas mensuales con sparkline (SVG).
 * - No usa librerías externas.
 * - Calcula los últimos N meses a partir de `documents`.
 * - Muestra total de la ventana, valor del mes actual, y tendencia.
 */
export default function MonthlyUploadsKPI({
  documents = [],
  months = 6, // ventana (ej. últimos 6 meses)
  height = 40,
  width = 160,
  title = "Subidas (últimos meses)",
}) {
  // Normaliza YYYY-MM de una fecha
  const ym = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  };

  const {
    labels, // ["2025-05","2025-06",...]
    counts, // [n1,n2,...]
    totalWindow, // suma en ventana
    current, // mes actual
    previous, // mes anterior
    prettyRange, // "Jun–Oct 2025"
  } = useMemo(() => {
    // 1) Construir lista de meses (YYYY-MM) desde hoy hacia atrás
    const now = new Date();
    const list = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      );
    }

    // 2) Contar documentos por mes (ignora eliminados)
    const counter = Object.create(null);
    for (const doc of documents) {
      if (doc?.deleted_at) continue;
      if (!doc?.fecha_subida) continue;
      const key = ym(doc.fecha_subida);
      counter[key] = (counter[key] || 0) + 1;
    }

    const arr = list.map((k) => counter[k] || 0);

    // 3) Totales y etiquetas bonitas
    const sum = arr.reduce((a, b) => a + b, 0);
    const cur = arr[arr.length - 1] || 0;
    const prev = arr.length > 1 ? arr[arr.length - 2] : 0;

    // Rango bonito: ej "Jun–Oct 2025" (si cruza año, muestra ambos)
    const first = list[0];
    const last = list[list.length - 1];
    const [fy, fm] = first.split("-").map(Number);
    const [ly, lm] = last.split("-").map(Number);
    const mnames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    const pretty =
      fy === ly
        ? `${mnames[fm - 1]}–${mnames[lm - 1]} ${ly}`
        : `${mnames[fm - 1]} ${fy} – ${mnames[lm - 1]} ${ly}`;

    return {
      labels: list,
      counts: arr,
      totalWindow: sum,
      current: cur,
      previous: prev,
      prettyRange: pretty,
    };
  }, [documents, months]);

  // Sparkline: escalar puntos a SVG
  const max = Math.max(1, ...counts);
  const pad = 2; // padding interno
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const stepX = counts.length > 1 ? innerW / (counts.length - 1) : 0;

  const points = counts.map((v, i) => {
    const x = pad + i * stepX;
    // y invertida (0 arriba, max abajo): más alto = valor mayor
    const y = pad + (1 - v / max) * innerH;
    return [x, y];
  });

  const pathD =
    points.length === 0
      ? ""
      : `M ${points.map(([x, y]) => `${x} ${y}`).join(" L ")}`;

  const delta = current - previous;
  const trend =
    delta === 0 ? "sin cambio" : delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <div
      className="kpi-card"
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 12,
        alignItems: "center",
        padding: 12,
        borderRadius: 12,
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        background: "var(--card-bg, #fff)",
      }}
      title={`Ventana: ${prettyRange}`}
    >
      <div style={{ minWidth: width }}>
        <svg width={width} height={height} aria-label="sparkline subidas">
          {/* línea base */}
          <line
            x1="0"
            y1={height - 1}
            x2={width}
            y2={height - 1}
            stroke="currentColor"
            opacity="0.1"
          />
          {/* línea de tendencia */}
          <path d={pathD} fill="none" stroke="currentColor" strokeWidth="2" />
          {/* último punto */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1][0]}
              cy={points[points.length - 1][1]}
              r="3"
              fill="currentColor"
            />
          )}
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#666" }}>{title}</div>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "baseline",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800 }}>{totalWindow}</div>
          <div style={{ fontSize: 13, color: "#666" }}>
            Mes actual: <strong>{current}</strong> ({trend})
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#888" }}>{prettyRange}</div>
      </div>
    </div>
  );
}
