import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/* 🎨  Paleta coherente con tu CSS (var(--accent-…)) */
const COLORS = [
  "#48a4e0", // accent-blue
  "#179c5a", // accent-green
  "#FFBB28",
  "#FF8042",
  "#845EC2",
  "#D65DB1",
  "#FF6F91",
  "#C4FCEF",
];

export default function CategoryPieChart({ documents = [] }) {
  /* —— agrupa solo los docs visibles para que respete filtros —— */
  const data = useMemo(() => {
    const counts = documents.reduce((acc, { categoria = "Sin categoría" }) => {
      acc[categoria] = (acc[categoria] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [documents]);

  if (data.length === 0) return null; // nada que mostrar

  return (
    <div className="chart-card">
      <h4>Documentos por categoría</h4>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={45}
            paddingAngle={3}
            label={(e) => `${e.name} (${e.value})`}
            isAnimationActive={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `${v} documento(s)`} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
