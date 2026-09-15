import React, { useEffect, useState } from "react";
import { FaBook, FaCalendarAlt, FaUsers } from "react-icons/fa";
import { getTurmas, getDashboardFrequenciaTurma, getDashboardTendencia } from "../services/api";
import PeriodoTable from "../components/dashboard/PeriodoTable";
import TendenciaChart from "../components/dashboard/TendenciaChart";
import "./RelatoriosPage.css";
import { dataBR } from "../utils/datas";
import PageHeader from '../components/PageHeader';
import Feedback from '../components/Feedback';
import '../components/dashboard/FiltrosAcesso.css';

export default function RelatoriosPage() {
  const [turmas, setTurmas] = useState([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => dataBR());
  const [errorFreq, setErrorFreq] = useState(null);
  
  const [frequenciaData, setFrequenciaData] = useState([]);
  const [loadingFreq, setLoadingFreq] = useState(false);

  const [tendenciaData, setTendenciaData] = useState([]);
  const [loadingTendencia, setLoadingTendencia] = useState(false);
  const [errorTurmas, setErrorTurmas] = useState(false);
  const [errorTendencia, setErrorTendencia] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setErrorTurmas(false);
    setErrorTendencia(false);
    getTurmas()
      .then((data) => {
        setTurmas(data);
        if (data.length > 0) {
          setSelectedTurmaId(current => data.some(turma => String(turma.id) === String(current)) ? current : data[0].id);
        }
      })
      .catch(() => setErrorTurmas(true));

    setLoadingTendencia(true);
    getDashboardTendencia(7)
      .then((data) => {
        setTendenciaData(data);
      })
      .catch(() => setErrorTendencia(true))
      .finally(() => setLoadingTendencia(false));
  }, [reload]);

  useEffect(() => {
    let active = true;
    setFrequenciaData([]);
    setErrorFreq(null);
    if (!selectedTurmaId || !selectedDate) {
      setLoadingFreq(false);
      return;
    }
    setLoadingFreq(true);
    getDashboardFrequenciaTurma(selectedTurmaId, selectedDate)
      .then((data) => {
        if (active) setFrequenciaData(data);
      })
      .catch(() => {
        if (active) setErrorFreq('Não foi possível consultar a frequência para esta data.');
      })
      .finally(() => { if (active) setLoadingFreq(false); });
    return () => { active = false; };
  }, [selectedTurmaId, selectedDate, reload]);

  return (
    <div className="relatorios-page">
      <PageHeader icon={FaBook} title="Relatórios de frequência" description="Acompanhe a presença por turma, data e período de aula." />

      <div className="relatorios-selectors-card">
        <div className="selectors-grid">
          <div className="selector-item">
            <label htmlFor="relatorio-turma"><FaUsers aria-hidden="true" /> Turma</label>
            <select
              id="relatorio-turma"
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
            <label htmlFor="relatorio-data"><FaCalendarAlt aria-hidden="true" /> Data de consulta</label>
            <input
              id="relatorio-data"
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
          {errorTurmas || errorFreq ? <Feedback error onRetry={() => setReload(value => value + 1)} title="Não foi possível consultar a frequência">Verifique sua conexão e tente novamente.</Feedback> : !selectedDate || !selectedTurmaId ? <Feedback title="Selecione uma turma e uma data">As presenças e faltas serão organizadas nos nove períodos de aula.</Feedback> : loadingFreq ? (
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
          {errorTendencia ? <Feedback error onRetry={() => setReload(value => value + 1)} title="Tendência indisponível">Não foi possível carregar os dados dos últimos sete dias.</Feedback> : loadingTendencia ? (
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
