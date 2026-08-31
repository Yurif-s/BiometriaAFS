import { useState, useEffect } from "react";
import { FaFingerprint, FaCheckCircle, FaExclamationTriangle, FaUserPlus, FaCog, FaHistory } from "react-icons/fa";
import { useWebSocket } from "../hooks/useWebSocket";

export default function TerminalAcesso({ onGoToCadastro, onGoToAdmin, showToast }) {
  const [time, setTime] = useState(new Date());
  const [status, setStatus] = useState("idle"); // 'idle', 'success', 'error', 'prompt-cadastro'
  const [alunoInfo, setAlunoInfo] = useState(null);
  const [falhas, setFalhas] = useState(0);
  const [dbAcessos, setDbAcessos] = useState(() => {
    try {
      const saved = localStorage.getItem("dbAcessos");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [dataFiltro, setDataFiltro] = useState("");

  // Atualiza relógio digital
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Persiste dbAcessos no localStorage
  useEffect(() => {
    try {
      localStorage.setItem("dbAcessos", JSON.stringify(dbAcessos));
    } catch (err) {
      console.error("Erro ao salvar dbAcessos no localStorage:", err);
    }
  }, [dbAcessos]);

  // Carrega últimos acessos do backend ao montar o componente
  useEffect(() => {
    const fetchUltimosAcessos = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/acessos`);
        if (response.ok) {
          const data = await response.json();
          setDbAcessos(data);
        }
      } catch (err) {
        console.error("Erro ao carregar acessos do backend:", err);
      }
    };
    fetchUltimosAcessos();
  }, []);

  // Callback de Biometria Lida (Sucesso)
  const handleBiometriaLida = (data) => {
    // Se estiver em modo de prompt, ignora ou reseta
    if (status === "prompt-cadastro") return;

    const { alunoNome, alunoMatricula, alunoTurma, tipoAcesso, horarioAcesso: horarioEvento } = data;

    if (alunoNome) {
      const tipo = tipoAcesso || "Entrada";
      const horarioAcesso = horarioEvento || new Date().toISOString();

      // Aluno reconhecido
      setAlunoInfo({
        nome: alunoNome,
        matricula: alunoMatricula,
        turma: alunoTurma,
        tipo,
        horario: new Date(horarioAcesso).toLocaleTimeString(),
      });
      setStatus("success");
      setFalhas(0);

      // Adiciona na lista geral de acessos
      const novoAcesso = {
        id: data.acessoId || Date.now(),
        tipo,
        horario: horarioAcesso,
        aluno: {
          nome: alunoNome,
          matricula: alunoMatricula,
          turma: {
            nome: alunoTurma,
          },
        },
      };
      setDbAcessos((prev) => [novoAcesso, ...prev]);

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

  // Filtra e mapeia os acessos para o formato exibido
  const getFilteredAcessos = () => {
    let list = dbAcessos;

    if (dataFiltro) {
      list = dbAcessos.filter((acesso) => {
        if (!acesso.horario) return false;
        const dataAcesso = new Date(acesso.horario);
        const ano = dataAcesso.getFullYear();
        const mes = String(dataAcesso.getMonth() + 1).padStart(2, "0");
        const dia = String(dataAcesso.getDate()).padStart(2, "0");
        const dataAcessoStr = `${ano}-${mes}-${dia}`;
        return dataAcessoStr === dataFiltro;
      });
    }

    return list.slice(0, 5).map((acesso) => ({
      id: acesso.id,
      nome: acesso.aluno?.nome || "Aluno Desconhecido",
      turma: acesso.aluno?.turma?.nome || "Sem Turma",
      tipo: acesso.tipo,
      horario: new Date(acesso.horario).toLocaleTimeString(),
    }));
  };

  const ultimosAcessosExibidos = getFilteredAcessos();

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
                <h3>Aguardando sua digital</h3>
                <p>Posicione a sua digital no leitor para registrar a entrada ou saída</p>
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

          {/* Filtro por data */}
          <div className="history-filter-container">
            <span className="history-filter-label">Filtrar por data</span>
            <div className="history-date-input-wrapper">
              <input
                type="date"
                className="history-date-input"
                value={dataFiltro}
                onChange={(e) => setDataFiltro(e.target.value)}
              />
              {dataFiltro && (
                <button
                  className="history-clear-btn"
                  onClick={() => setDataFiltro("")}
                  title="Limpar filtro"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="history-list">
            {ultimosAcessosExibidos.length === 0 ? (
              <div className="empty-history">
                <p>Nenhum registro de acesso recente.</p>
              </div>
            ) : (
              ultimosAcessosExibidos.map((acesso, i) => (
                <div key={acesso.id || i} className={`history-item ${acesso.tipo.toLowerCase()}`}>
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
