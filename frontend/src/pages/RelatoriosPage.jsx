import React, { useEffect, useState } from "react";
import { FaBook, FaCalendarAlt, FaUsers } from "react-icons/fa";
import { getTurmas, getDashboardFrequenciaTurma, getDashboardTendencia } from "../services/api";
import PeriodoTable from "../components/dashboard/PeriodoTable";
import TendenciaChart from "../components/dashboard/TendenciaChart";
import "./RelatoriosPage.css";

export default function RelatoriosPage() {
  const [turmas, setTurmas] = useState([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  
  const [frequenciaData, setFrequenciaData] = useState([]);
  const [loadingFreq, setLoadingFreq] = useState(false);

  const [tendenciaData, setTendenciaData] = useState([]);
  const [loadingTendencia, setLoadingTendencia] = useState(false);

  useEffect(() => {
    getTurmas()
      .then((data) => {
        setTurmas(data);
        if (data.length > 0) {
          setSelectedTurmaId(data[0].id);
        }
      })
      .catch(console.error);

    setLoadingTendencia(true);
    getDashboardTendencia(7)
      .then((data) => {
        setTendenciaData(data);
      })
      .catch(console.error)
      .finally(() => setLoadingTendencia(false));
  }, []);

  useEffect(() => {
    if (selectedTurmaId) {
      setLoadingFreq(true);
      getDashboardFrequenciaTurma(selectedTurmaId, selectedDate)
        .then((data) => {
          setFrequenciaData(data);
        })
        .catch(console.error)
        .finally(() => setLoadingFreq(false));
    }
  }, [selectedTurmaId, selectedDate]);

  return (
    <div className="relatorios-page">
      <div className="relatorios-header">
        <div className="title-with-icon">
          <FaBook className="page-icon" />
          <h2>Relatórios de Frequência</h2>
        </div>
      </div>

      <div className="relatorios-selectors-card">
        <div className="selectors-grid">
          <div className="selector-item">
            <label><FaUsers /> Turma</label>
            <select
              className="filtro-select"
              value={selectedTurmaId}
              onChange={(e) => setSelectedTurmaId(e.target.value)}
            >
              {turmas.length === 0 ? (
                <option value="">Nenhuma turma cadastrada</option>
              ) : (
                turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="selector-item">
            <label><FaCalendarAlt /> Data de Consulta</label>
            <input
              type="date"
              className="filtro-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="widget-card">
        <div className="widget-header">
          <h3>Frequência por Período de Aula</h3>
          <p className="widget-subtitle">A grade de 9 períodos reflete a presença com base no horário de entrada e saída</p>
        </div>
        <div className="widget-body">
          {loadingFreq ? (
            <div className="table-loading">
              <div className="spinner"></div>
              <p>Gerando mapa de períodos...</p>
            </div>
          ) : (
            <PeriodoTable data={frequenciaData} />
          )}
        </div>
      </div>

      <div className="widget-card">
        <div className="widget-header">
          <h3>Tendência de Acessos (Últimos 7 dias)</h3>
          <p className="widget-subtitle">Volume diário consolidado de movimentação dos alunos</p>
        </div>
        <div className="widget-body">
          {loadingTendencia ? (
            <div className="table-loading">
              <div className="spinner"></div>
              <p>Carregando tendência...</p>
            </div>
          ) : (
            <TendenciaChart data={tendenciaData} />
          )}
        </div>
      </div>
    </div>
  );
}
