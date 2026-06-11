import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";

export default function EditTurmaModal({
  isOpen,
  onClose,
  turma,
  onSave,
  turmaExists,
}) {
  const [formData, setFormData] = useState({ nome: "", ano: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && turma) {
      setFormData({ nome: turma.nome, ano: turma.ano });
      setError("");
    }
  }, [isOpen, turma]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSave = () => {
    if (!formData.nome?.trim()) {
      setError("Nome da turma e obrigatorio.");
      return;
    }

    const anoNumerico = Number(formData.ano);
    if (!anoNumerico || Number.isNaN(anoNumerico)) {
      setError("Ano invalido.");
      return;
    }

    if (turmaExists && turmaExists(formData.nome, turma.id)) {
      setError(`Ja existe uma turma com o nome "${formData.nome}".`);
      return;
    }

    onSave(turma.id, { nome: formData.nome.trim(), ano: anoNumerico });
    onClose();
  };

  if (!isOpen || !turma) return null;

  return (
    <div className="edit-modal" role="presentation" onMouseDown={onClose}>
      <div
        className="edit-panel card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-turma-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header-row">
          <h3 id="edit-turma-title">Editar Turma</h3>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Fechar modal de edicao de turma"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <div className="form-grid">
          <div className="input-group">
            <label htmlFor="edit-turma-nome">Nome da Turma</label>
            <input
              id="edit-turma-nome"
              type="text"
              value={formData.nome}
              onChange={(event) => handleChange("nome", event.target.value)}
              aria-invalid={Boolean(error)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="edit-turma-ano">Ano</label>
            <input
              id="edit-turma-ano"
              type="number"
              value={formData.ano}
              onChange={(event) => handleChange("ano", event.target.value)}
              min="2000"
              max="2099"
              aria-invalid={Boolean(error)}
            />
          </div>
        </div>

        {error && <p className="error-msg modal-error" role="alert">{error}</p>}

        <div className="buttons modal-actions">
          <button type="button" className="salvar" onClick={handleSave}>
            Salvar Alteracoes
          </button>
          <button type="button" className="limpar" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
