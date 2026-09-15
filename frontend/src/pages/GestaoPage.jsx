import React, { useState } from "react";
import { FaUsers } from "react-icons/fa";
import StatusBanner from "../components/StatusBanner";
import CadastroForm from "../components/CadastroForm";
import AlunosTable from "../components/AlunosTable";
import EditModal from "../components/EditModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import TurmasManager from "../components/TurmasManager";

import { useAlunos } from "../hooks/useAlunos";
import { useTurmas } from "../hooks/useTurmas";
import { useStatus } from "../hooks/useStatus";
import PageHeader from '../components/PageHeader';
import './GestaoPage.css';
import Feedback from '../components/Feedback';

export default function GestaoPage({ showToast }) {
  const { turmas, turmaOptions, addTurma, deleteTurma, updateTurma, turmaExists, loading: loadingTurmas, error: errorTurmas, refetch: refetchTurmas } = useTurmas();
  const { alunos, addAluno, updateAluno, deleteAluno, matriculaExists, loading: loadingAlunos, error: errorAlunos, refetch: refetchAlunos } = useAlunos(turmaOptions);
  const { statusMessage, showStatus, showMsg } = useStatus();

  // Edit
  const [editingForm, setEditingForm] = useState(null);

  const handleEditClick = (aluno) => setEditingForm({ ...aluno, turma_id: aluno.turma_id ?? aluno.turma?.id });
  const handleEditChange = (field, value) =>
    setEditingForm((prev) => ({ ...prev, [field]: value }));

  const handleUpdate = async () => {
    if (!editingForm.nome.trim() || !editingForm.matricula.trim() || (!editingForm.turma_id && !editingForm.turma?.id)) {
      showMsg("Preencha nome, matrícula e turma para atualizar.", 3000);
      return;
    }
    try {
      await updateAluno(editingForm.id, {
        nome: editingForm.nome.trim(),
        matricula: editingForm.matricula.trim(),
        biometria: Number(editingForm.biometria),
        turma_id: Number(editingForm.turma_id ?? editingForm.turma?.id),
      });
      showToast("Dados salvos com sucesso!");
      setEditingForm(null);
    } catch (err) {
      const msg = err.response?.data?.message ?? "Erro ao salvar alterações.";
      showToast(msg, "error");
    }
  };

  // Delete aluno
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteClick = (aluno) => {
    setDeleteTarget(aluno);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await deleteAluno(deleteTarget.id);
      const nome = deleteTarget.nome;
      showToast(`Aluno "${nome}" removido com sucesso.`);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erro ao remover aluno';
      showToast(msg, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
    setShowDeleteConfirm(false);
  };

  // Cadastro
  const handleCadastroSave = async (formData) => {
    if (matriculaExists && matriculaExists(formData.matricula.trim())) {
      showToast("Já existe um aluno com essa matrícula.", "error");
      return false;
    }
    try {
      await addAluno({
        nome: formData.nome.trim(),
        matricula: formData.matricula.trim(),
        biometria: Number(formData.biometria),
        turma_id: Number(formData.turma),
      });
      showToast(`Aluno "${formData.nome.trim()}" cadastrado com sucesso!`);
      return true;
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erro ao cadastrar aluno';
      showToast(msg, "error");
      return false;
    }
  };

  return (
    <div className="gestao-page">
      <PageHeader icon={FaUsers} title="Alunos e turmas" description="Organize as turmas e gerencie os cadastros da escola.">
        <button type="button"
          className="count-link"
          disabled={loadingAlunos || !!errorAlunos}
          onClick={() =>
            document.getElementById("lista-alunos")?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <strong>{loadingAlunos || errorAlunos ? '—' : alunos.length}</strong> alunos cadastrados
        </button>
      </PageHeader>

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

      {loadingAlunos || loadingTurmas ? <div className="card table-loading" role="status"><div className="spinner" />Carregando cadastros...</div>
      : errorAlunos || errorTurmas ? <div className="card"><Feedback error title="Não foi possível carregar os cadastros" onRetry={() => { refetchAlunos(); refetchTurmas(); }}>
        Verifique sua conexão e tente novamente. Seus cadastros não foram alterados.
      </Feedback></div> : <>
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
        showToast={showToast}
      />

      <AlunosTable
        alunos={alunos}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />
      </>}
    </div>
  );
}
