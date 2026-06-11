import { FaTrash } from "react-icons/fa";

export default function DeleteConfirmModal({ target, loading, onConfirm, onCancel, type = "aluno" }) {
  const labels = {
    turma: {
      loading: "Excluindo turma...",
      body: `Tem certeza que deseja excluir a turma "${target?.nome}"? Isso pode afetar alunos vinculados a ela.`,
    },
    acesso: {
      loading: "Excluindo acesso...",
      body: "Tem certeza que deseja apagar este registro de acesso?",
    },
    aluno: {
      loading: "Excluindo aluno...",
      body: `Tem certeza que deseja excluir o aluno "${target?.nome}"?`,
    },
  };
  const content = labels[type] ?? labels.aluno;

  return (
    <div className="edit-modal" role="presentation" onMouseDown={onCancel}>
      <div
        className="edit-panel card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {loading ? (
          <div className="loading-delete" role="status" aria-live="polite">
            <p>{content.loading}</p>
            <div className="loading-bar" />
          </div>
        ) : (
          <>
            <div className="modal-title-row">
              <div className="danger-icon-box" aria-hidden="true">
                <FaTrash />
              </div>
              <h3 id="delete-confirm-title">Confirmar exclusão</h3>
            </div>

            <p className="confirm-message">{content.body}</p>

            <div className="buttons">
              <button type="button" className="confirm-yes salvar" onClick={onConfirm}>
                Sim, excluir
              </button>
              <button type="button" className="limpar" onClick={onCancel}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
