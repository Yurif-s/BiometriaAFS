import "./App.css";
import logo from "./assets/logo.png";
import { useState, useEffect } from "react";

import {
  FaClipboardList,
  FaUsers,
  FaSave,
  FaTrash,
  FaPen,
  FaUndo,
  FaSearch,
  FaFingerprint,
} from "react-icons/fa";

const initialAlunos = [
  {
    nome: "Maria Eduarda Silva",
    matricula: "2025001",
    turma: "1º A Info",
    digital: "12345",
  },
  {
    nome: "João Pedro Santos",
    matricula: "2025002",
    turma: "1º A Info",
    digital: "12346",
  },
  {
    nome: "Ana Beatriz Lima",
    matricula: "2025003",
    turma: "2º B Adm",
    digital: "12347",
  },
];

function App() {

  const [pesquisa, setPesquisa] = useState("");

  const [alunos, setAlunos] = useState(() => {
    const saved = localStorage.getItem("alunos");
    return saved ? JSON.parse(saved) : initialAlunos;
  });

  const [formData, setFormData] = useState({
    nome: "",
    matricula: "",
    turma: "",
    digital: "",
  });

  const turmaOpcoesDefault = [
    "1ª Informática",
    "2ª Informática",
    "3º Desenvolvimento de Sistemas",
  ];

  const turmaOptions = [...new Set([...turmaOpcoesDefault, ...alunos.map((aluno) => aluno.turma)])];

  const [statusMessage, setStatusMessage] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const [errors, setErrors] = useState({ nome: false, matricula: false, turma: false });
  const [savingAnim, setSavingAnim] = useState(false);
  const [clearingAnim, setClearingAnim] = useState(false);
  const [step, setStep] = useState(1);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("alunos", JSON.stringify(alunos));
  }, [alunos]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const handleSave = () => {
    setSavingAnim(true);
    setTimeout(() => setSavingAnim(false), 300);
    const missing = {
      nome: !formData.nome.trim(),
      matricula: !formData.matricula.trim(),
      turma: !formData.turma.trim(),
    };

    if (missing.nome || missing.matricula || missing.turma) {
      setErrors(missing);
      setStatusMessage("Preencha os campos obrigatórios marcados.");
      setShowStatus(true);
      return;
    }

    setErrors({ nome: false, matricula: false, turma: false });
    setShowStatus(false);
    setStep(2);
  };

  const handleCollectDigital = () => {
    if (biometricLoading) return;
    setBiometricLoading(true);

    setTimeout(() => {
      const generatedDigital = `BIO-${Math.floor(100000 + Math.random() * 900000)}`;
      setFormData((prev) => ({ ...prev, digital: generatedDigital }));
      setBiometricLoading(false);
      setStatusMessage("Digital coletada com sucesso!");
      setShowStatus(true);
      setStep(3);
      setTimeout(() => setShowStatus(false), 3000);
    }, 2000);
  };

  const handleFinalSave = () => {
    if (alunos.some((aluno) => aluno.matricula === formData.matricula.trim())) {
      setStatusMessage("Já existe um aluno com essa matrícula.");
      setShowStatus(true);
      return;
    }

    const novoAluno = {
      nome: formData.nome.trim(),
      matricula: formData.matricula.trim(),
      turma: formData.turma.trim(),
      digital: formData.digital.trim() || "-",
    };

    setAlunos((prev) => [novoAluno, ...prev]);
    setFormData({ nome: "", matricula: "", turma: "", digital: "" });
    setErrors({ nome: false, matricula: false, turma: false });
    setStatusMessage("Aluno cadastrado com sucesso!");
    setShowStatus(true);
    setStep(1);
    setTimeout(() => setShowStatus(false), 3000);
  };

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = (matricula) => {
    setAlunos((prev) => prev.filter((aluno) => aluno.matricula !== matricula));
    setStatusMessage("Aluno removido com sucesso.");
    setShowStatus(true);
    setTimeout(() => setShowStatus(false), 3000);
  };

  const handleDeleteClick = (aluno) => {
    setDeleteTarget(aluno);
    setShowDeleteConfirm(true);
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
    setShowDeleteConfirm(false);
  };

  const handleDeleteConfirm = () => {
    setDeleteLoading(true);
    setTimeout(() => {
      handleDelete(deleteTarget.matricula);
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }, 800);
  };

  const [editingForm, setEditingForm] = useState(null);

  const handleEditClick = (aluno) => {
    setEditingForm({ ...aluno });
  };

  const handleEditChange = (field, value) => {
    setEditingForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = () => {
    if (!editingForm.nome.trim() || !editingForm.matricula.trim() || !editingForm.turma.trim()) {
      setStatusMessage("Preencha nome, matrícula e turma para atualizar.");
      setShowStatus(true);
      return;
    }

    setAlunos((prev) => prev.map((a) => (a.matricula === editingForm.matricula ? editingForm : a)));
    setStatusMessage("Dados salvos");
    setShowStatus(true);
    setEditingForm(null);
    setTimeout(() => setShowStatus(false), 3000);
  };

  const handleCancelEdit = () => {
    setEditingForm(null);
  };

  const handleClear = () => {
    setClearingAnim(true);
    setTimeout(() => setClearingAnim(false), 250);
    setFormData({ nome: "", matricula: "", turma: "", digital: "" });
    setStatusMessage("");
    setShowStatus(false);
    setErrors({ nome: false, matricula: false, turma: false });
  };

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">

        <div className="logo-area">
          <img src={logo} alt="logo" className="logo" />
        </div>

        <div className="title-area">

          <div className="icon-box">
            <FaClipboardList />
          </div>

          <h1>Sistema de Frequência</h1>

        </div>

      </header>

      {/* CONTEÚDO */}
      <main className="container">

        {/* TOPO */}
        <section className="top-section">

          <div className="aluno-title">

            <div className="circle-icon">
              <FaUsers />
            </div>

            <div>
              <h2>Alunos</h2>
              <p>Cadastre, edite, visualize e remova alunos</p>
            </div>

          </div>

          <div className="novo-btn">
            Alunos cadastrados: {alunos.length}
          </div>

        </section>

        {showStatus && (
          <div className="status-banner" style={{ marginBottom: 20 }}>
            <span>{statusMessage}</span>
          </div>
        )}

        {/* EDIT MODAL */}
        {editingForm && (
          <div className="edit-modal">
            <div className="edit-panel card">
              <h3>Editar Aluno</h3>

              <div className="form-grid">
                <div className="input-group">
                  <label>Nome</label>
                  <input
                    type="text"
                    value={editingForm.nome}
                    onChange={(e) => handleEditChange("nome", e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Matrícula</label>
                  <input
                    type="text"
                    value={editingForm.matricula}
                    disabled
                  />
                </div>

                <div className="input-group">
                  <label>Turma</label>
                  <select
                    value={editingForm.turma}
                    onChange={(e) => handleEditChange("turma", e.target.value)}
                  >
                    <option value="">Selecione a turma</option>
                    {turmaOptions.map((turma) => (
                      <option key={turma} value={turma}>
                        {turma}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>ID da Digital</label>
                  <input
                    type="text"
                    value={editingForm.digital}
                    onChange={(e) => handleEditChange("digital", e.target.value)}
                  />
                </div>
              </div>

              <div className="buttons">
                <button type="button" className="salvar" onClick={handleUpdate}>
                  Atualizar
                </button>

                <button type="button" className="limpar" onClick={handleCancelEdit}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION */}
        {showDeleteConfirm && (
          <div className="confirm-modal">
            <div className="confirm-box card">
              {deleteLoading ? (
                <div className="loading-delete">
                  <p>Excluindo aluno...</p>
                  <div className="loading-bar"></div>
                </div>
              ) : (
                <>
                  <h3>Tem certeza?</h3>
                  <p>Você tem certeza que deseja excluir <strong>{deleteTarget?.nome}</strong>?</p>
                  <div className="buttons confirm-actions">
                    <button type="button" className="confirm-yes" onClick={handleDeleteConfirm}>
                      Sim
                    </button>
                    <button type="button" className="confirm-no" onClick={handleDeleteCancel}>
                      Não
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}



        {/* FORM */}
        <section className="card">

          {showStatus && (
            <div className="status-banner">
              <span>{statusMessage}</span>
              <div className="loading-bar"></div>
            </div>
          )}

          {step === 1 && (
            <>
              <h3>Cadastrar Aluno</h3>

              <div className="form-grid">

                <div className="input-group">
                  <label>Nome</label>
                  <input
                    type="text"
                    placeholder="Nome completo do aluno"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    className={errors.nome ? "input-error" : ""}
                  />
                  {errors.nome && <small className="error-msg">Campo obrigatório</small>}
                </div>

                <div className="input-group">
                  <label>Matrícula</label>
                  <input
                    type="text"
                    placeholder="Número da matrícula"
                    value={formData.matricula}
                    onChange={(e) => handleInputChange("matricula", e.target.value)}
                    className={errors.matricula ? "input-error" : ""}
                  />
                  {errors.matricula && <small className="error-msg">Campo obrigatório</small>}
                </div>

                <div className="input-group">
                  <label>Turma</label>
                  <select
                    value={formData.turma}
                    onChange={(e) => handleInputChange("turma", e.target.value)}
                    className={errors.turma ? "input-error" : ""}
                  >
                    <option value="">Selecione a turma</option>
                    {[...new Set([...turmaOpcoesDefault, ...alunos.map((aluno) => aluno.turma)])].map((turma) => (
                      <option key={turma} value={turma}>
                        {turma}
                      </option>
                    ))}
                  </select>
                  {errors.turma && <small className="error-msg">Campo obrigatório</small>}
                </div>

              </div>

              <div className="buttons">
                <button type="button" className={`salvar ${savingAnim ? 'clicked' : ''}`} onClick={handleSave}>
                  <FaSave />
                  Prosseguir →
                </button>

                <button type="button" className={`limpar ${clearingAnim ? 'clicked' : ''}`} onClick={handleClear}>
                  <FaUndo />
                  Limpar
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="biometric-card">
              <h3>Leitura Biométrica</h3>
              <p className="biometric-text">Posicione o dedo no sensor para coletar a digital do aluno</p>

              <div className="biometric-preview">
                <div className={`fingerprint-icon ${biometricLoading ? 'loading' : ''}`}>
                  <FaFingerprint />
                </div>
              </div>

              <div className="buttons">
                <button type="button" className="salvar" onClick={handleCollectDigital} disabled={biometricLoading}>
                  {biometricLoading ? 'Coletando...' : 'Coletar Digital'}
                </button>
                <button type="button" className="limpar" onClick={() => setStep(1)}>
                  Voltar
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="confirmation-card">
              <h3>Confirmação</h3>
              <div className="confirm-content">
                <div className="confirm-row">
                  <span className="confirm-label">Nome</span>
                  <strong>{formData.nome}</strong>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">Matrícula</span>
                  <strong>{formData.matricula}</strong>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">Turma</span>
                  <strong>{formData.turma}</strong>
                </div>
                <div className="status-chip">Digital cadastrada ✅</div>
              </div>

              <div className="buttons">
                <button type="button" className="limpar" onClick={() => setStep(1)}>
                  Editar
                </button>
                <button type="button" className="salvar" onClick={handleFinalSave}>
                  Salvar Cadastro
                </button>
              </div>
            </div>
          )}

        </section>

        {/* TABELA */}
        <section className="card">
          {/* PESQUISA */}
          <section className="search-box">

            <FaSearch className="search-icon" />

            <input
              type="text"
              placeholder="Pesquisar aluno..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />

          </section>

          <h3>Lista de Alunos</h3>

          <table>

            <thead>
              <tr>
                <th>Nome</th>
                <th>Matrícula</th>
                <th>Turma</th>
                <th>ID da Digital</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>

              {alunos
                .filter((aluno) =>
                  aluno.nome
                    .toLowerCase()
                    .includes(pesquisa.toLowerCase())
                )
                .map((aluno, index) => (

                  <tr key={index}>

                    <td>{aluno.nome}</td>
                    <td>{aluno.matricula}</td>
                    <td>{aluno.turma}</td>
                    <td>{aluno.digital}</td>

                    <td className="acoes">
                      <button
                        type="button"
                        className="editar"
                        onClick={() => handleEditClick(aluno)}
                      >
                        <FaPen />
                      </button>

                      <button
                        type="button"
                        className="excluir"
                        onClick={() => handleDeleteClick(aluno)}
                      >
                        <FaTrash />
                      </button>
                    </td>

                  </tr>
                ))}

            </tbody>

          </table>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="footer">
        © 2025 EEEP Adolfo Ferreira de Sousa. Todos os direitos reservados.
      </footer>

    </div>
  );
}

export default App;