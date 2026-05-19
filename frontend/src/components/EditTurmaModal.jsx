// EditTurmaModal.jsx
import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

export default function EditTurmaModal({ 
  isOpen, 
  onClose, 
  turma, 
  onSave, 
  turmaExists 
}) {
  const [formData, setFormData] = useState({ nome: "", ano: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && turma) {
      console.log("📌 Modal abriu com turma:", turma);
      setFormData({ nome: turma.nome, ano: turma.ano });
      setError("");
    }
  }, [isOpen, turma]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSave = () => {
    console.log("🟢 Botão Salvar clicado!");
    console.log("Dados atuais:", formData);
    console.log("Função onSave recebida:", typeof onSave);

    if (!formData.nome?.trim()) {
      setError("Nome da turma é obrigatório.");
      console.log("❌ Erro: Nome vazio");
      return;
    }

    const anoNumerico = Number(formData.ano);
    if (!anoNumerico || isNaN(anoNumerico)) {
      setError("Ano inválido.");
      console.log("❌ Erro: Ano inválido");
      return;
    }

    if (turmaExists && turmaExists(formData.nome, turma.id)) {
      setError(`Já existe uma turma com o nome "${formData.nome}".`);
      console.log("❌ Erro: Turma já existe");
      return;
    }

    console.log("✅ Tudo validado. Chamando onSave...");
    onSave(turma.id, { nome: formData.nome.trim(), ano: anoNumerico });
    onClose();
  };

  if (!isOpen || !turma) return null;

  return (
    <div className="edit-modal">
      <div className="edit-panel card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h3>Editar Turma</h3>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "26px", cursor: "pointer", color: "#666" }}
          >
            <FaTimes />
          </button>
        </div>

        <div className="form-grid">
          <div className="input-group">
            <label>Nome da Turma</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Ano</label>
            <input
              type="number"
              value={formData.ano}
              onChange={(e) => handleChange("ano", e.target.value)}
              min="2000"
              max="2099"
            />
          </div>
        </div>

        {error && <p className="error-msg" style={{ marginTop: "16px" }}>{error}</p>}

        <div className="buttons" style={{ marginTop: "32px" }}>
          <button type="button" className="salvar" onClick={handleSave}>
            Salvar Alterações
          </button>
          <button type="button" className="limpar" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}