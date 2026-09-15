import React, { useEffect, useState } from "react";
import { FaUsers, FaArrowAltCircleRight, FaArrowAltCircleLeft, FaDoorOpen, FaUserTimes, FaFingerprint, FaChartLine } from "react-icons/fa";
import { useDashboard } from "../hooks/useDashboard";
import { getAcessosHoje } from "../services/api";
import KpiCard from "../components/dashboard/KpiCard";
import LiveFeed from "../components/dashboard/LiveFeed";
import HourlyChart from "../components/dashboard/HourlyChart";
import TipoChart from "../components/dashboard/TipoChart";
import TurmaRanking from "../components/dashboard/TurmaRanking";
import "./DashboardHome.css";
import PageHeader from '../components/PageHeader';
import Feedback from '../components/Feedback';

export default function DashboardHome() {
  const { resumo, porHora, loading, error, refresh } = useDashboard(30000);
  const [rankingData, setRankingData] = useState([]);

  useEffect(() => {
    getAcessosHoje()
      .then((acessos) => {
        const counts = {};
        acessos.forEach((a) => {
          if (new Date(a.horario) > new Date()) return;
          const t = a.aluno?.turma?.nome || "Sem Turma";
          counts[t] = (counts[t] || 0) + 1;
        });
        const ranking = Object.entries(counts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setRankingData(ranking);
      })
      .catch(console.error);
  }, []);

  if (loading && !resumo) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando painel principal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="widget-card">
        <Feedback error title="Não foi possível carregar o painel" onRetry={refresh}>Verifique sua conexão e tente novamente para consultar os indicadores da escola.</Feedback>
      </div>
    );
  }

  const kpis = resumo || {
    totalAlunos: 0,
    totalTurmas: 0,
    acessosHoje: { entrada: 0, saida: 0 },
    presentesAgora: 0,
    naoEntraram: 0,
    slotsEmUso: 0
  };

  return (
    <div className="dashboard-home">
      <PageHeader icon={FaChartLine} title="Visão geral" description="Um resumo da frequência e das movimentações de hoje." />
      <div className="kpi-grid">
        <KpiCard
          title="Alunos Cadastrados"
          value={kpis.totalAlunos}
          icon={<FaUsers />}
          color="#526b61"
          subtitle={`${kpis.totalTurmas} turmas ativas`}
        />
        <KpiCard
          title="Entradas Hoje"
          value={kpis.acessosHoje.entrada}
          icon={<FaArrowAltCircleRight />}
          color="#008044"
          subtitle="Registros de entrada"
        />
        <KpiCard
          title="Saídas Hoje"
          value={kpis.acessosHoje.saida}
          icon={<FaArrowAltCircleLeft />}
          color="#a86923"
          subtitle="Registros de saída"
        />
        <KpiCard
          title="Presentes Agora"
          value={kpis.presentesAgora}
          icon={<FaDoorOpen />}
          color="#008044"
          subtitle="Alunos dentro da escola"
        />
        <KpiCard
          title="Ausentes Hoje"
          value={kpis.naoEntraram}
          icon={<FaUserTimes />}
          color="#ad4848"
          subtitle="Alunos pendentes de entrada"
        />
        <KpiCard
          title="Biometrias no sensor"
          value={`${kpis.slotsEmUso} / 127`}
          icon={<FaFingerprint />}
          color="#526b61"
          subtitle={`${((kpis.slotsEmUso / 127) * 100).toFixed(0)}% da capacidade`}
        />
      </div>

      <div className="dashboard-widgets-grid">
        <div className="widgets-column-left">
          <div className="widget-card">
            <div className="widget-header">
              <h3>Distribuição de Acessos por Hora</h3>
            </div>
            <div className="widget-body">
              <HourlyChart data={porHora} />
            </div>
          </div>

          <div className="widget-card">
            <div className="widget-header">
              <h3>Proporção de Acessos</h3>
            </div>
            <div className="widget-body">
              <TipoChart entrada={kpis.acessosHoje.entrada} saida={kpis.acessosHoje.saida} />
            </div>
          </div>
        </div>

        <div className="widgets-column-right">
          <div className="widget-card-container">
            <LiveFeed />
          </div>

          <div className="widget-card-container">
            <TurmaRanking data={rankingData} />
          </div>
        </div>
      </div>
    </div>
  );
}
