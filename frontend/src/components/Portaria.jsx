import React, { useState } from 'react';
import { FaCheckCircle, FaUser, FaIdBadge, FaDoorOpen, FaClock, FaSignOutAlt, FaSignInAlt, FaFingerprint } from 'react-icons/fa';
import { useWebSocket } from '../hooks/useWebSocket';
import { horarioBR } from '../utils/datas';
import { Link } from 'react-router-dom';
import ConnectionStatus from './ConnectionStatus';
import './Portaria.css';

export default function Portaria() {
  const [alunoInfo, setAlunoInfo] = useState(null);

  // Quando a biometria for lida com sucesso (liberado/entrada)
  const handleBiometriaLida = (data) => {
    const { alunoNome, alunoMatricula, alunoTurma, tipoAcesso, horarioAcesso } = data;

    if (alunoNome) {
      setAlunoInfo({
        nome: alunoNome,
        matricula: alunoMatricula,
        turma: alunoTurma,
        tipo: tipoAcesso || 'Entrada',
        horario: horarioBR(horarioAcesso || new Date()),
      });
    }
  };

  // Ignorar falhas na portaria, o zelador só precisa ver quem passou
  const handleBiometriaFalha = () => {};

  const connection = useWebSocket(handleBiometriaLida, handleBiometriaFalha);

  const handleConfirmar = () => {
    // Animação de saída antes de limpar o estado poderia ser feita aqui
    setAlunoInfo(null);
  };

  return (
    <div className="portaria-container">
      <div className="portaria-header">
        <div className="portaria-brand">
          <Link to="/" className="logo-text">Biometria <span>AFS</span></Link>
          <span className="portaria-label">Portaria</span>
        </div>
        <ConnectionStatus connection={connection} />
      </div>

      <div className="portaria-content">
        {!alunoInfo ? (
          <div className="waiting-card">
            <div className="icon-wrapper glass-icon">
              <FaFingerprint />
            </div>
            <h2>Acompanhamento de acessos</h2>
            <p>Os dados do aluno aparecerão aqui assim que a digital for reconhecida no terminal.</p>
            <Link className="portaria-back" to="/">Voltar ao terminal</Link>
          </div>
        ) : (
          <div className="student-card pop-in">
            <div className={`status-badge-icon ${alunoInfo.tipo === 'Saída' ? 'badge-saida' : 'badge-entrada'}`}>
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
