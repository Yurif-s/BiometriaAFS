import React, { useState, useEffect } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { FaChartLine, FaHistory, FaBook, FaUsersCog, FaTerminal, FaDoorOpen, FaBars, FaTimes } from "react-icons/fa";
import "./DashboardLayout.css";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className={`dashboard-container${sidebarOpen ? " sidebar-open" : ""}`}>
      <div
        className="sidebar-overlay"
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`dashboard-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">AFS</div>
          <h2>Biometria <span>AFS</span></h2>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink 
            to="/dashboard" 
            end 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <FaChartLine className="nav-icon" />
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink 
            to="/dashboard/historico" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <FaHistory className="nav-icon" />
            <span>Histórico</span>
          </NavLink>
          
          <NavLink 
            to="/dashboard/relatorios" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <FaBook className="nav-icon" />
            <span>Relatórios</span>
          </NavLink>
          
          <NavLink 
            to="/dashboard/gestao" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <FaUsersCog className="nav-icon" />
            <span>Gestão</span>
          </NavLink>
          
          <div className="nav-divider">Telas Operacionais</div>
          
          <Link to="/" className="nav-item external">
            <FaTerminal className="nav-icon" />
            <span>Terminal</span>
          </Link>
          
          <Link to="/portaria" className="nav-item external">
            <FaDoorOpen className="nav-icon" />
            <span>Portaria</span>
          </Link>
        </nav>
        
        <div className="sidebar-footer">
          <p>Painel Operacional v2.0</p>
        </div>
      </aside>
      
      <main className="dashboard-content">
        <header className="dashboard-header">
          <div className="header-left">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-expanded={sidebarOpen}
              aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            >
              {sidebarOpen ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
            </button>
            <div className="header-title-section">
              <h1>Painel de Controle</h1>
              <p>EEEP Adolfo Ferreira de Sousa</p>
            </div>
          </div>
          <div className="header-status">
            <span className="status-indicator-dot online"></span>
            <span className="status-indicator-text">Sensor Biométrico Online</span>
          </div>
        </header>
        
        <div className="dashboard-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
