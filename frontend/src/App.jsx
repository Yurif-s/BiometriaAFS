// App.jsx — Versão 1: Toast customizado (sem biblioteca externa)
import "./App.css";
import { useState } from "react";
import { FaUsers } from "react-icons/fa";

import Header from "./components/Header";
import Footer from "./components/Footer";
import StatusBanner from "./components/StatusBanner";
import CadastroForm from "./components/CadastroForm";
import AlunosTable from "./components/AlunosTable";
import EditModal from "./components/EditModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import TurmasManager from "./components/TurmasManager";
import Toast from "./components/Toast";

import { useAlunos } from "./hooks/useAlunos";
import { useTurmas } from "./hooks/useTurmas";
import { useStatus } from "./hooks/useStatus";
import { useToast } from "./hooks/useToast";

function App() {
  const { turmas, turmaOptions, addTurma, deleteTurma, updateTurma, turmaExists } = useTurmas();
  const { alunos, addAluno, updateAluno, deleteAluno, matriculaExists } = useAlunos(turmaOptions);
  const { statusMessage, showStatus, showMsg } = useStatus();
  const { toast, showToast, hideToast } = useToast();

  // Edit
  const [editingForm, setEditingForm] = useState(null);

  const handleEditClick = (aluno) => setEditingForm({ ...aluno });
  const handleEditChange = (field, value) =>
    setEditingForm((prev) => ({ ...prev, [field]: value }));

  const handleUpdate = () => {
    if (!editingForm.nome.trim() || !editingForm.matricula.trim() || !editingForm.turma.trim()) {
      showMsg("Preencha nome, matrícula e turma para atualizar.", 3000);
      return;
    }
    updateAluno(editingForm);
    showMsg("Dados salvos");
    setEditingForm(null);
  };

  // Delete aluno
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteClick = (aluno) => {
    setDeleteTarget(aluno);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    setDeleteLoading(true);
    setTimeout(() => {
      deleteAluno(deleteTarget.matricula);
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      const nome = deleteTarget.nome;
      setDeleteTarget(null);
      // 🎉 Toast de sucesso
      showToast(`Aluno "${nome}" removido com sucesso.`);
    }, 800);
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
    setShowDeleteConfirm(false);
  };

  // Cadastro
  const handleCadastroSave = (formData) => {
    if (matriculaExists(formData.matricula.trim())) {
      showToast("Já existe um aluno com essa matrícula.", "error");
      return false;
    }
    addAluno({
      nome: formData.nome.trim(),
      matricula: formData.matricula.trim(),
      turma: formData.turma.trim(),
      digital: formData.digital.trim() || "-",
    });
    showToast(`Aluno "${formData.nome.trim()}" cadastrado com sucesso!`);
    return true;
  };

  return (
    <div className="app">
      <Header />

      <main className="container">
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
          <div
            className="novo-btn"
            style={{ cursor: "pointer" }}
            onClick={() =>
              document.getElementById("lista-alunos").scrollIntoView({ behavior: "smooth" })
            }
          >
            Alunos cadastrados: {alunos.length}
          </div>
        </section>

        {showStatus && <StatusBanner message={statusMessage} />}

        {editingForm && (
          <EditModal
            editingForm={editingForm}
            turmaOptions={turmaOptions}
            onChange={handleEditChange}
            onUpdate={handleUpdate}
            onCancel={() => setEditingForm(null)}
          />
        )}

        {showDeleteConfirm && (
          <DeleteConfirmModal
            target={deleteTarget}
            loading={deleteLoading}
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
            type="aluno"
          />
        )}

        {/* TurmasManager recebe showToast para disparar após excluir turma */}
        <TurmasManager
          turmas={turmas}
          onAdd={addTurma}
          onUpdate={updateTurma}
          onDelete={deleteTurma}
          turmaExists={turmaExists}
          showToast={showToast}
        />

        <CadastroForm
          turmaOptions={turmaOptions}
          onSave={handleCadastroSave}
          showStatus={showStatus}
          statusMessage={statusMessage}
        />

        <AlunosTable
          alunos={alunos}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      </main>

      <Footer />

      {/* Toast global */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}
    </div>
  );
}

export default App;