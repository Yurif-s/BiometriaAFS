import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Toast from "./components/Toast";
import Footer from "./components/Footer";
import { useToast } from "./hooks/useToast";

const DashboardLayout = lazy(() => import("./components/dashboard/DashboardLayout"));
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const HistoricoPage = lazy(() => import("./pages/HistoricoPage"));
const RelatoriosPage = lazy(() => import("./pages/RelatoriosPage"));
const GestaoPage = lazy(() => import("./pages/GestaoPage"));
const TerminalPage = lazy(() => import("./pages/TerminalPage"));
const PortariaPage = lazy(() => import("./pages/PortariaPage"));

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="spinner" />
      <span>Carregando...</span>
    </div>
  );
}

function App() {
  const { toast, showToast, hideToast } = useToast();

  return (
    <BrowserRouter>
      <div className="app">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<TerminalPage showToast={showToast} />} />
            <Route path="/portaria" element={<PortariaPage />} />

            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome showToast={showToast} />} />
              <Route path="historico" element={<HistoricoPage showToast={showToast} />} />
              <Route path="relatorios" element={<RelatoriosPage showToast={showToast} />} />
              <Route path="gestao" element={<GestaoPage showToast={showToast} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        <Routes>
          <Route path="/" element={<Footer />} />
        </Routes>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={hideToast}
          />
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
