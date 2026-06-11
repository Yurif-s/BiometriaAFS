import React, { useEffect, useState } from "react";
import { FaBroadcastTower, FaUserCheck, FaUserMinus } from "react-icons/fa";
import { useWebSocket } from "../../hooks/useWebSocket";
import { getAcessosHoje } from "../../services/api";
import "./LiveFeed.css";

export default function LiveFeed() {
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    getAcessosHoje()
      .then((data) => {
        setFeed(data.slice(0, 10));
      })
      .catch((err) => console.error("Erro ao carregar feed inicial", err));
  }, []);

  const handleLiveAccess = (wsData) => {
    if (!wsData.alunoNome) return;

    const novoAcesso = {
      id: `live-${Date.now()}-${Math.random()}`,
      tipo: wsData.saida ? "Saída" : "Entrada",
      horario: wsData.saida || wsData.entrada || new Date().toISOString(),
      aluno: {
        nome: wsData.alunoNome,
        matricula: wsData.alunoMatricula,
        turma: {
          nome: wsData.alunoTurma || "Sem Turma"
        }
      },
      isNew: true
    };

    setFeed((prev) => [novoAcesso, ...prev.slice(0, 9)]);
  };

  useWebSocket(handleLiveAccess, () => {
    // Opcionalmente podemos tratar falhas
  });

  return (
    <div className="live-feed-card">
      <div className="card-header-feed">
        <div className="title-with-status">
          <FaBroadcastTower className="feed-icon pulsing" />
          <h3>Atividade Recente</h3>
        </div>
        <span className="live-badge">Ao Vivo</span>
      </div>

      <div className="feed-list">
        {feed.length === 0 ? (
          <div className="empty-feed">Nenhum acesso hoje ainda.</div>
        ) : (
          feed.map((acesso) => {
            const isEntrada = acesso.tipo === "Entrada";
            const hora = new Date(acesso.horario).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            });

            return (
              <div 
                key={acesso.id} 
                className={`feed-item ${acesso.isNew ? "new-item animate-in" : ""}`}
              >
                <div className={`feed-avatar ${isEntrada ? "in" : "out"}`}>
                  {isEntrada ? <FaUserCheck /> : <FaUserMinus />}
                </div>
                <div className="feed-info">
                  <div className="feed-student-name">{acesso.aluno.nome}</div>
                  <div className="feed-student-meta">
                    <span className="feed-turma">{acesso.aluno.turma?.nome || "Sem Turma"}</span>
                    <span className="feed-divider">•</span>
                    <span className="feed-matricula">RA: {acesso.aluno.matricula}</span>
                  </div>
                </div>
                <div className="feed-time-badge">
                  <span className={`badge-type ${isEntrada ? "in" : "out"}`}>
                    {acesso.tipo}
                  </span>
                  <span className="badge-time">{hora}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
