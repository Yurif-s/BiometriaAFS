import React from "react";
import "./KpiCard.css";

export default function KpiCard({ title, value, icon, color = "#009245", subtitle }) {
  return (
    <div className="kpi-card" style={{ "--card-accent-color": color }}>
      <div className="kpi-card-header">
        <span className="kpi-card-title">{title}</span>
        <div 
          className="kpi-card-icon" 
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          {icon}
        </div>
      </div>
      <div className="kpi-card-body">
        <span className="kpi-card-value">{value}</span>
        {subtitle && <span className="kpi-card-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
