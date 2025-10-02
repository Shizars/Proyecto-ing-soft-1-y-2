import React, { useEffect, useState } from "react";
import { rptSatisfactionOverall } from "../services/satisfaction";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import "./SatisfactionOverallWidget.css";

export default function SatisfactionOverallWidget({
  refreshMs = 5000,
  threshold = 4,
}) {
  const [data, setData] = useState({
    total: 0,
    satisfechos: 0,
    insatisfechos: 0,
    pct_satis: 0,
    pct_insatisfechos: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await rptSatisfactionOverall({ threshold });
      setData(res.data);
    } catch (e) {
      console.error("Satisfaction overall report error:", e);
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
  }, [refreshMs, threshold]);

  const chartData = [
    { name: "Satisfechos", value: data.satisfechos },
    { name: "Insatisfechos", value: data.insatisfechos },
  ];

  return (
    <div className="stat-card donut-card">
      <div className="head">
        <h4>Satisfacción Global : F-SGC-036</h4>
        <span className="badge">n={data.total}</span>
      </div>

      <div className="donut-body">
        <div className="donut-chart">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
              >
                <Cell key="sat" className="c-sat" />
                <Cell key="ins" className="c-ins" />
              </Pie>
              <Tooltip
                formatter={(v, n) => [`${v}`, n]}
                contentStyle={{ borderRadius: 10 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center">
            {loading ? "…" : `${data.pct_satis}%`}
            <small>Satisfechos</small>
          </div>
        </div>

        <ul className="donut-legend">
          <li>
            <i className="dot c-sat" />
            <span>Satisfechos</span>
            <b>{data.satisfechos}</b>
            <em>{data.pct_satis}%</em>
          </li>
          <li>
            <i className="dot c-ins" />
            <span>Insatisfechos</span>
            <b>{data.insatisfechos}</b>
            <em>{data.pct_insatisfechos}%</em>
          </li>
          <li className="rule">
            <span className="muted">Regla</span>
            <em> ≥ {data.threshold} de 6 “Satisfecho(a)”</em>
          </li>
        </ul>
      </div>
    </div>
  );
}
