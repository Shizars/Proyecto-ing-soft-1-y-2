import React, { useMemo } from "react";
import { PieChart, Pie, Cell } from "recharts";
import "./CategoryPieChart.css";

/* Toma primero los tres colores corporativos y añade un par de neutros  */
const COLORS = [
  "var(--accent-blue)", // celeste fundación
  "var(--accent-green)", // verde acción
  "var(--accent-purple)", // azul oscuro secundario
  "#FFBB28", // amarillo neutro
  "#FF8042", // naranja neutro
];

export default function CategoryPieChart({
  documents,
  title = "Por categoría",
}) {
  /* --- cuenta cuántos docs por categoría y % --- */
  const data = useMemo(() => {
    const counts = {};
    documents.forEach((d) => {
      const cat = d.categoria || "Sin categoría";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const total = documents.length || 1;
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      percent: ((value / total) * 100).toFixed(1),
    }));
  }, [documents]);

  return (
    <div className="stat-card pie-card">
      <h4>{title}</h4>

      <div className="pie-body">
        {/* ---------- Donut ---------- */}
        <PieChart width={180} height={180}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={75}
            dataKey="value"
            /* quitamos las labels internas para evitar solapamientos */
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>

        {/* ---------- Leyenda ---------- */}
        <ul className="pie-legend">
          {data.map((d, i) => (
            <li key={d.name}>
              <span
                className="dot"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="name">{d.name}</span>
              <span className="count">{d.value}</span>
              <span className="percent">{d.percent}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
