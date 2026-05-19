import { FaTrash } from "react-icons/fa";

export default function DeleteConfirmModal({ target, loading, onConfirm, onCancel, type = "aluno" }) {
  const label = type === "turma"
    ? `Tem certeza que deseja excluir a turma "${target?.nome}"? Isso pode afetar alunos vinculados a ela.`
    : `Tem certeza que deseja excluir o aluno "${target?.nome}" do ?`;

  return (
    <div className="edit-modal">
      <div className="edit-panel card">
        {loading ? (
          <div className="loading-delete">
            <p>{type === "turma" ? "Excluindo turma..." : "Excluindo aluno..."}</p>
            <div className="loading-bar" />
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "rgba(255,75,75,0.1)",
                  border: "1px solid rgba(255,75,75,0.2)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "#ff4b4b",
                  fontSize: "20px",
                  flexShrink: 0,
                }}
              >
                <FaTrash />
              </div>
              <h3 style={{ margin: 0 }}>Confirmar exclusão</h3>
            </div>

            <p style={{ color: "#555", fontSize: "15px", lineHeight: "1.6", marginBottom: "28px" }}>
              {label}
            </p>

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