import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import "./Charts.css"; // We'll add center label styles here

export default function TipoChart({ entrada = 0, saida = 0 }) {
  const data = [
    { name: "Entradas", value: entrada, color: "#009245" },
    { name: "Saídas", value: saida, color: "#ea580c" }
  ];

  const total = entrada + saida;

  // Evitar que dê erro se não houver acessos hoje
  const chartData = total === 0 
    ? [{ name: "Nenhum acesso", value: 1, color: "#cbd5e1" }] 
    : data.filter(d => d.value > 0);

  return (
    <div className="chart-wrapper donut-container" style={{ width: "100%", height: 260, position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={total === 0 ? 0 : 5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {total > 0 && (
            <Tooltip 
              formatter={(value) => [`${value} acessos`, 'Tipo']}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px',
                fontSize: 12
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center-label">
        <span className="donut-number">{total}</span>
        <span className="donut-text">Acessos</span>
      </div>
    </div>
  );
}
