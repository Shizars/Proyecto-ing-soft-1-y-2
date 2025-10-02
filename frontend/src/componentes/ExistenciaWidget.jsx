import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import api from "../services/api";
import "./ExistenciaWidget.css";

const COLORS = ["#16a34a", "#ef4444"]; // verde = existentes, rojo = inexistentes

export default function ExistenciaWidget({ refreshMs = 5000 }) {
  const [data, setData] = useState(null);

  const loadData = async () => {
    try {
      const res = await api.get("/v2/reports/existencia-global");
      setData(res.data);
    } catch (err) {
      console.error("Error cargando existencia:", err);
    }
  };

  useEffect(() => {
    loadData();
    if (refreshMs) {
      const t = setInterval(loadData, refreshMs);
      return () => clearInterval(t);
    }
  }, [refreshMs]);

  if (!data) return <div className="stat-card">Cargando...</div>;

  const globalChart = [
    { name: "Existentes", value: data.global.existentes },
    { name: "Inexistentes", value: data.global.inexistentes },
  ];

  return (
    <div className="stat-card existencia-card">
      <h4> Existencia de Documentos : F-SGC-033</h4>

      {/* -------- Gráfico -------- */}
      <div className="existencia-body">
        <div className="pie-container">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={globalChart}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label
              >
                {globalChart.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* -------- Tabla por programa -------- */}
        <ul className="existencia-legend">
          {data.por_programa.map((p) => (
            <li key={p.programa}>
              <span className="programa">{p.programa}</span>
              <span className="ok">{p.existentes}</span> /
              <span className="fail">{p.inexistentes}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
