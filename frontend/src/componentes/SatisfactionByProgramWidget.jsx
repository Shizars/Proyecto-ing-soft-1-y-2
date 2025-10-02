import React, { useEffect, useState } from "react";
import { rptSatisfactionByProgramPct } from "../services/satisfaction";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import "./SatisfactionByProgramWidget.css";

/**
 * Muestra % de satisfechos por programa (umbral configurable).
 * Props:
 *  - refreshMs (default 5000)
 *  - threshold (default 4)
 *  - minN (default 1)
 */
export default function SatisfactionByProgramWidget({
  refreshMs = 5000,
  threshold = 4,
  minN = 1,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [asc, setAsc] = useState(false); // orden asc/desc por % satisfechos

  const load = async () => {
    try {
      const res = await rptSatisfactionByProgramPct({ threshold, min_n: minN });
      setRows(res.data || []);
    } catch (e) {
      console.error("rpt by program satisfaction error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (refreshMs) {
      const t = setInterval(load, refreshMs);
      return () => clearInterval(t);
    }
  }, [refreshMs, threshold, minN]);

  const data = [...rows].sort((a, b) => {
    return asc
      ? a.pct_satisfechos - b.pct_satisfechos
      : b.pct_satisfechos - a.pct_satisfechos;
  });

  return (
    <div className="stat-card sat-prog-card">
      <div className="head">
        <h4> Satisfechos por programa : F-SGC-036</h4>
        <div className="controls">
          <span className="badge">thr ≥ {threshold}/6</span>
          <span className="badge">min n={minN}</span>
          <button
            className="ghost"
            onClick={() => setAsc((v) => !v)}
            title="Invertir orden"
          >
            {asc ? "Asc" : "Desc"}
          </button>
        </div>
      </div>

      <div className="chart-wrap">
        {loading ? (
          <div className="loading">Cargando…</div>
        ) : data.length === 0 ? (
          <div className="empty">Sin datos</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
            >
              <CartesianGrid
                horizontal
                vertical={false}
                strokeDasharray="3 3"
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis type="category" dataKey="programa" width={90} />
              <Tooltip
                formatter={(v, n, p) => {
                  if (n === "pct_satisfechos")
                    return [`${v}%`, "% Satisfechos"];
                  return [v, n];
                }}
                labelFormatter={(label) => `Programa: ${label}`}
                contentStyle={{ borderRadius: 8 }}
              />
              <Bar dataKey="pct_satisfechos" radius={[6, 6, 6, 6]}>
                {/* color via CSS */}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {!loading && data.length > 0 && (
        <ul className="mini-legend">
          {data.slice(0, 5).map((r) => (
            <li key={r.programa}>
              <i className="dot" />
              <span className="name">{r.programa}</span>
              <b>{r.pct_satisfechos}%</b>
              <em>
                ({r.satisfechos}/{r.total})
              </em>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
