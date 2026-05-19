export default function DeleteConfirmModal({ target, loading, onConfirm, onCancel }) {
  return (
    <div className="confirm-modal">
      <div className="confirm-box card">
        {loading ? (
          <div className="loading-delete">
            <p>Excluindo aluno...</p>
            <div className="loading-bar" />
          </div>
        ) : (
          <>
            <h3>Tem certeza?</h3>
            <p>
              Você tem certeza que deseja excluir <strong>{target?.nome}</strong>?
            </p>
            <div className="buttons confirm-actions">
              <button type="button" className="confirm-yes" onClick={onConfirm}>
                Sim
              </button>
              <button type="button" className="confirm-no" onClick={onCancel}>
                Não
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}