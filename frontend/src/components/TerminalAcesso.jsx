import { useState, useEffect } from "react";
import { FaFingerprint, FaCheckCircle, FaExclamationTriangle, FaUserPlus, FaCog, FaHistory } from "react-icons/fa";
import { useWebSocket } from "../hooks/useWebSocket";

export default function TerminalAcesso({ onGoToCadastro, onGoToAdmin, showToast }) {
  const [time, setTime] = useState(new Date());
  const [status, setStatus] = useState("idle"); // 'idle', 'success', 'error', 'prompt-cadastro'
  const [alunoInfo, setAlunoInfo] = useState(null);
  const [falhas, setFalhas] = useState(0);
  const [ultimosAcessos, setUltimosAcessos] = useState([]);

  // Atualiza relógio digital
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Callback de Biometria Lida (Sucesso)
  const handleBiometriaLida = (data) => {
    // Se estiver em modo de prompt, ignora ou reseta
    if (status === "prompt-cadastro") return;

    const { alunoNome, alunoMatricula, alunoTurma, entrada, saida } = data;

    if (alunoNome) {
      // Aluno reconhecido
      setAlunoInfo({
        nome: alunoNome,
        matricula: alunoMatricula,
        turma: alunoTurma,
        tipo: saida ? "Saída" : "Entrada",
        horario: new Date(saida || entrada).toLocaleTimeString(),
      });
      setStatus("success");
      setFalhas(0);

      // Adiciona na lista de últimos acessos
      setUltimosAcessos((prev) => [
        {
          nome: alunoNome,
          turma: alunoTurma,
          tipo: saida ? "Saída" : "Entrada",
          horario: new Date(saida || entrada).toLocaleTimeString(),
        },
        ...prev.slice(0, 4), // mantém apenas os 5 últimos
      ]);

      if (showToast) {
        showToast(`Bem-vindo(a), ${alunoNome}!`, "success");
      }

      // Reseta status em 4 segundos
      setTimeout(() => {
        setStatus("idle");
        setAlunoInfo(null);
      }, 4000);
    }
  };

  // Callback de Biometria Não Reconhecida (Falha)
  const handleBiometriaFalha = () => {
    if (status === "prompt-cadastro") return;

    const novasFalhas = falhas + 1;
    setFalhas(novasFalhas);

    if (novasFalhas >= 3) {
      setStatus("prompt-cadastro");
      if (showToast) {
        showToast("Digital não reconhecida após 3 tentativas.", "error");
      }
    } else {
      setStatus("error");
      if (showToast) {
        showToast(`Digital não reconhecida! Tentativa ${novasFalhas} de 3.`, "error");
      }
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }
  };

  useWebSocket(handleBiometriaLida, handleBiometriaFalha);

  const resetarFalhas = () => {
    setFalhas(0);
    setStatus("idle");
  };

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-logo">
          <h2>Terminal de Frequência</h2>
          <p>Biometria AFS</p>
        </div>
        <div className="terminal-controls">
          <button className="admin-btn" onClick={onGoToAdmin} title="Painel Admin">
            <FaCog /> Painel Admin
          </button>
        </div>
      </div>

      <div className="terminal-grid">
        {/* LADO ESQUERDO: Relógio e Sensor */}
        <div className="terminal-card main-card">
          <div className="clock-section">
            <div className="clock-time">{time.toLocaleTimeString()}</div>
            <div className="clock-date">
              {time.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          <div className="sensor-section">
            {status === "idle" && (
              <>
                <div className="fingerprint-container pulsing">
                  <FaFingerprint className="fg-icon idle" />
                </div>
                <h3>Posicione o Dedo</h3>
                <p>Encoste o dedo no leitor para registrar a entrada ou saída</p>
                {falhas > 0 && <span className="warning-badge">Tentativas falhas: {falhas}/3</span>}
              </>
            )}

            {status === "success" && alunoInfo && (
              <>
                <div className="fingerprint-container success-glow">
                  <FaCheckCircle className="fg-icon success" />
                </div>
                <h3 className="success-text">Acesso Liberado!</h3>
                <div className="aluno-details-card">
                  <h4>{alunoInfo.nome}</h4>
                  <p><strong>Turma:</strong> {alunoInfo.turma}</p>
                  <p><strong>Matrícula:</strong> {alunoInfo.matricula}</p>
                  <div className="status-badge">
                    {alunoInfo.tipo} registrada às {alunoInfo.horario}
                  </div>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <div className="fingerprint-container error-glow">
                  <FaExclamationTriangle className="fg-icon error" />
                </div>
                <h3 className="error-text">Digital não identificada</h3>
                <p>Tente posicionar o dedo no centro do leitor novamente.</p>
                <span className="warning-badge">Tentativa {falhas} de 3</span>
              </>
            )}

            {status === "prompt-cadastro" && (
              <>
                <div className="fingerprint-container prompt-glow">
                  <FaExclamationTriangle className="fg-icon prompt" />
                </div>
                <h3 className="prompt-text">Aluno Não Encontrado</h3>
                <p className="prompt-desc">
                  Não foi possível identificar a biometria após 3 tentativas consecutivas.
                </p>
                <div className="prompt-actions">
                  <button className="cadastrar-btn" onClick={onGoToCadastro}>
                    <FaUserPlus /> Cadastrar Novo Aluno
                  </button>
                  <button className="limpar" onClick={resetarFalhas}>
                    Tentar Novamente
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* LADO DIREITO: Últimos Acessos */}
        <div className="terminal-card history-card">
          <div className="history-header">
            <FaHistory />
            <h3>Últimos Registros</h3>
          </div>
          <div className="history-list">
            {ultimosAcessos.length === 0 ? (
              <div className="empty-history">
                <p>Nenhum registro de acesso recente.</p>
              </div>
            ) : (
              ultimosAcessos.map((acesso, i) => (
                <div key={i} className={`history-item ${acesso.tipo.toLowerCase()}`}>
                  <div className="history-avatar">
                    {acesso.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="history-info">
                    <span className="history-name">{acesso.nome}</span>
                    <span className="history-turma">{acesso.turma}</span>
                  </div>
                  <div className="history-time-badge">
                    <span className="time">{acesso.horario}</span>
                    <span className="type">{acesso.tipo}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
