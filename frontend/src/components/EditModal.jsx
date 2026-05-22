export default function EditModal({ editingForm, turmaOptions, onChange, onUpdate, onCancel }) {
  if (!editingForm) return null;

  return (
    <div className="edit-modal">
      <div className="edit-panel card">
        <h3>Editar Aluno</h3>

        <div className="form-grid">
          <div className="input-group">
            <label>Nome</label>
            <input
              type="text"
              value={editingForm.nome}
              onChange={(e) => onChange("nome", e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Matrícula</label>
            <input type="text" value={editingForm.matricula} disabled />
          </div>

          <div className="input-group">
            <label>Turma</label>
            <select
              value={editingForm.turma_id ?? editingForm.turma?.id ?? ""}
              onChange={(e) => onChange("turma_id", Number(e.target.value))}
            >
              <option value="">Selecione a turma</option>
              {turmaOptions.map((turma) => (
                <option key={turma.id} value={turma.id}>{turma.nome}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>ID da Digital</label>
            <input
              type="number"
              value={editingForm.biometria ?? ""}
              onChange={(e) => onChange("biometria", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="buttons">
          <button type="button" className="salvar" onClick={onUpdate}>
            Atualizar
          </button>
          <button type="button" className="limpar" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}