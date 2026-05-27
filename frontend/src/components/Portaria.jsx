import React, { useState } from 'react';
import { FaCheckCircle, FaUser, FaIdBadge, FaDoorOpen, FaClock, FaSignOutAlt, FaSignInAlt, FaFingerprint } from 'react-icons/fa';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Portaria() {
  const [alunoInfo, setAlunoInfo] = useState(null);

  // Quando a biometria for lida com sucesso (liberado/entrada)
  const handleBiometriaLida = (data) => {
    const { alunoNome, alunoMatricula, alunoTurma, entrada, saida } = data;

    if (alunoNome) {
      setAlunoInfo({
        nome: alunoNome,
        matricula: alunoMatricula,
        turma: alunoTurma,
        tipo: saida ? 'Saída' : 'Entrada',
        horario: new Date(saida || entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }
  };

  // Ignorar falhas na portaria, o zelador só precisa ver quem passou
  const handleBiometriaFalha = () => {};

  useWebSocket(handleBiometriaLida, handleBiometriaFalha);

  const handleConfirmar = () => {
    // Animação de saída antes de limpar o estado poderia ser feita aqui
    setAlunoInfo(null);
  };

  return (
    <div className="portaria-container">
      <div className="portaria-header">
        <div className="logo-text">Portaria <span>App</span></div>
        <div className="status-indicator">
          <div className="dot pulse-green"></div>
          Online
        </div>
      </div>

      <div className="portaria-content">
        {!alunoInfo ? (
          <div className="waiting-card">
            <div className="icon-wrapper glass-icon">
              <FaFingerprint />
            </div>
            <h2>Aguardando Liberação...</h2>
            <p>Os dados do aluno aparecerão aqui assim que a digital for reconhecida no terminal.</p>
          </div>
        ) : (
          <div className="student-card pop-in">
            <div className={`status-badge ${alunoInfo.tipo === 'Saída' ? 'badge-saida' : 'badge-entrada'}`}>
              {alunoInfo.tipo === 'Saída' ? <FaSignOutAlt /> : <FaSignInAlt />}
              {alunoInfo.tipo} Registrada
            </div>
            
            <div className="student-avatar">
              <FaUser />
            </div>
            
            <h1 className="student-name">{alunoInfo.nome}</h1>
            
            <div className="info-grid">
              <div className="info-item">
                <FaDoorOpen className="info-icon" />
                <div className="info-text">
                  <span>Turma</span>
                  <strong>{alunoInfo.turma}</strong>
                </div>
              </div>
              
              <div className="info-item">
                <FaIdBadge className="info-icon" />
                <div className="info-text">
                  <span>Matrícula</span>
                  <strong>{alunoInfo.matricula}</strong>
                </div>
              </div>

              <div className="info-item">
                <FaClock className="info-icon" />
                <div className="info-text">
                  <span>Horário</span>
                  <strong>{alunoInfo.horario}</strong>
                </div>
              </div>
            </div>

            <button className="confirm-btn" onClick={handleConfirmar}>
              <FaCheckCircle />
              Confirmar Visualização
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
