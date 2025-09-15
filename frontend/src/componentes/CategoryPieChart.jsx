import React, { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import "./CategoryPieChart.css";

/**
 * Puedes pasarle `data` directamente:
 *   [{ name: "PEE", value: 10 }, ...]
 * o pasar `documents` y lo agrupa por `categoria`.
 */
export default function CategoryPieCard({
  title = "Por categoría",
  data,
  documents,
}) {
  const items = useMemo(() => {
    if (Array.isArray(data)) return data;

    // agrupa por documents[].categoria
    const map = new Map();
    (documents || []).forEach((d) => {
      const key = d.categoria || "—";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [data, documents]);

  const total = items.reduce((a, b) => a + (b.value || 0), 0);
  const palette = [
    "#60a5fa",
    "#34d399",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#10b981",
    "#f472b6",
    "#a78bfa",
  ];

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const tooltipStyle = {
    background: isDark ? "#0f1521" : "#ffffff",
    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
    borderRadius: 8,
    fontSize: 12,
    color: isDark ? "#e5e7eb" : "#111827",
  };

  return (
    <div className="stat-card pie-card">
      <div className="card-head">
        <h4>{title}</h4>
      </div>

      <div className="pie-body">
        <div className="pie-canvas">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={items}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={1.5}
                stroke={isDark ? "#0b1220" : "#ffffff"}
                strokeWidth={2}
              >
                {items.map((_, i) => (
                  <Cell key={i} fill={palette[i % palette.length]} />
                ))}
              </Pie>
              <Tooltip
                wrapperStyle={{ outline: "none" }}
                contentStyle={tooltipStyle}
                formatter={(v, n) => [`${v}`, n]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="pie-legend">
          {items.map((it, i) => {
            const pct = total ? ((it.value / total) * 100).toFixed(1) : "0.0";
            return (
              <li key={it.name}>
                <span
                  className="dot"
                  style={{ background: palette[i % palette.length] }}
                />
                <span className="name">{it.name}</span>
                <span className="count">{it.value}</span>
                <span className="percent">{pct}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
