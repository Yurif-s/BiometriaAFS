import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function TendenciaChart({ data = [] }) {
  return (
    <div className="chart-wrapper" style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis 
            dataKey="dataExibicao" 
            tickLine={false} 
            axisLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11 }} 
          />
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11 }} 
            allowDecimals={false} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px',
              fontSize: 12
            }}
            labelStyle={{ fontWeight: '600', color: '#1e293b' }}
          />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle" 
            iconSize={8}
            wrapperStyle={{ fontSize: 12, fontWeight: 500 }}
          />
          <Line 
            type="monotone" 
            dataKey="entrada" 
            name="Entradas" 
            stroke="#009245" 
            strokeWidth={2.5} 
            activeDot={{ r: 6 }} 
            dot={{ r: 4 }} 
          />
          <Line 
            type="monotone" 
            dataKey="saida" 
            name="Saídas" 
            stroke="#ea580c" 
            strokeWidth={2.5} 
            activeDot={{ r: 6 }} 
            dot={{ r: 4 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
