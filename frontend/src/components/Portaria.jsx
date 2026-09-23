import React, { useState, useEffect } from 'react';
import { FaSignOutAlt, FaDoorOpen, FaUser } from 'react-icons/fa';
import { useWebSocket } from '../hooks/useWebSocket';
import { horarioBR } from '../utils/datas';
import { getAcessosHoje } from '../services/api';
import { Link } from 'react-router-dom';
import ConnectionStatus from './ConnectionStatus';
import './Portaria.css';

const MAX_SAIDAS = 10;

export default function Portaria() {
  const [saidas, setSaidas] = useState([]);

  // Carrega as saídas de hoje já registradas ao abrir a página
  useEffect(() => {
    getAcessosHoje()
      .then((data) => {
        const somenteSaidas = data
          .filter((acesso) => acesso.tipo === 'Saída' && new Date(acesso.horario) <= new Date())
          .slice(0, MAX_SAIDAS)
          .map((acesso) => ({
            id: acesso.id,
            nome: acesso.aluno?.nome,
            matricula: acesso.aluno?.matricula,
            turma: acesso.aluno?.turma?.nome,
            horario: horarioBR(acesso.horario),
          }));
        setSaidas(somenteSaidas);
      })
      .catch((err) => console.error('Erro ao carregar saídas recentes', err));
  }, []);

  // A portaria só acompanha saídas — leituras de Entrada são ignoradas aqui.
  const handleBiometriaLida = (data) => {
    if (data.tipoAcesso !== 'Saída' || !data.alunoNome) return;

    const novaSaida = {
      id: `live-${Date.now()}-${Math.random()}`,
      nome: data.alunoNome,
      matricula: data.alunoMatricula,
      turma: data.alunoTurma,
      horario: horarioBR(data.horarioAcesso || new Date()),
      isNew: true,
    };

    setSaidas((prev) => [novaSaida, ...prev.slice(0, MAX_SAIDAS - 1)]);
  };

  // Ignorar falhas na portaria, o zelador só precisa ver quem saiu
  const handleBiometriaFalha = () => {};

  const connection = useWebSocket(handleBiometriaLida, handleBiometriaFalha);

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
        <div className="saidas-card">
          <div className="saidas-header">
            <FaSignOutAlt className="saidas-icon" />
            <h2>Saídas recentes</h2>
          </div>

          {saidas.length === 0 ? (
            <div className="saidas-empty">
              <FaDoorOpen className="saidas-empty-icon" />
              <p>Nenhuma saída registrada ainda hoje.</p>
            </div>
          ) : (
            <div className="saidas-list">
              {saidas.map((saida) => (
                <div key={saida.id} className={`saida-item ${saida.isNew ? 'pop-in' : ''}`}>
                  <div className="saida-avatar">
                    <FaUser />
                  </div>
                  <div className="saida-info">
                    <span className="saida-nome">{saida.nome}</span>
                    <span className="saida-meta">
                      {saida.turma || 'Sem Turma'} · RA: {saida.matricula}
                    </span>
                  </div>
                  <span className="saida-horario">{saida.horario}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
