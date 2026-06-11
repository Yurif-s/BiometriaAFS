import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function HourlyChart({ data }) {
  return (
    <div className="chart-wrapper" style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="hora" 
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
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' 
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
          <Bar 
            dataKey="entrada" 
            name="Entrada" 
            fill="#009245" 
            radius={[4, 4, 0, 0]} 
            barSize={12} 
          />
          <Bar 
            dataKey="saida" 
            name="Saída" 
            fill="#ea580c" 
            radius={[4, 4, 0, 0]} 
            barSize={12} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
