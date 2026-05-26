import React, { useEffect, useState } from "react";
import { FaHistory, FaTrash, FaEdit } from "react-icons/fa";
import { useAcessos } from "../hooks/useAcessos";

export default function AcessosManager({ showToast }) {
  const { todosAcessos, fetchTodosAcessos, updateAcesso, deleteAcesso, loading } = useAcessos();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ tipo: "", horario: "" });

  useEffect(() => {
    fetchTodosAcessos();
  }, [fetchTodosAcessos]);

  const handleEdit = (acesso) => {
    setEditingId(acesso.id);
    const date = new Date(acesso.horario);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    setEditForm({
      tipo: acesso.tipo,
      horario: date.toISOString().slice(0, 16) // yyyy-MM-ddThh:mm
    });
  };

  const handleSave = async (id) => {
    try {
      await updateAcesso(id, {
        tipo: editForm.tipo,
        horario: new Date(editForm.horario).toISOString(),
      });
      showToast("Acesso atualizado com sucesso!", "success");
      setEditingId(null);
    } catch (err) {
      showToast("Erro ao atualizar acesso.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja apagar este registro de acesso?")) {
      try {
        await deleteAcesso(id);
        showToast("Acesso removido com sucesso!", "success");
      } catch (err) {
        showToast("Erro ao remover acesso.", "error");
      }
    }
  };

  return (
    <section className="acessos-manager-section" style={{ marginTop: "2rem" }}>
      <div className="section-header">
        <div className="title-with-icon">
          <FaHistory className="section-icon" />
          <h3>Histórico de Frequência</h3>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <p style={{ textAlign: "center", padding: "2rem" }}>Carregando histórico...</p>
        ) : (
          <table className="alunos-table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Turma</th>
                <th>Tipo</th>
                <th>Horário</th>
                <th style={{ width: "120px", textAlign: "center" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {todosAcessos.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>Nenhum acesso registrado.</td>
                </tr>
              ) : (
                todosAcessos.map((acesso) => (
                  <tr key={acesso.id}>
                    <td>
                      <div className="aluno-info">
                        <div className="aluno-avatar">{acesso.aluno.nome.charAt(0)}</div>
                        <div>
                          <div className="aluno-nome">{acesso.aluno.nome}</div>
                          <div className="aluno-matricula">{acesso.aluno.matricula}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="turma-badge">{acesso.aluno.turma?.nome}</span>
                    </td>
                    <td>
                      {editingId === acesso.id ? (
                        <select
                          className="form-input"
                          value={editForm.tipo}
                          onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value })}
                        >
                          <option value="Entrada">Entrada</option>
                          <option value="Saída">Saída</option>
                        </select>
                      ) : (
                        <span className={`status-badge ${acesso.tipo.toLowerCase() === 'entrada' ? 'active' : 'inactive'}`}>
                          {acesso.tipo}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingId === acesso.id ? (
                        <input
                          type="datetime-local"
                          className="form-input"
                          value={editForm.horario}
                          onChange={(e) => setEditForm({ ...editForm, horario: e.target.value })}
                        />
                      ) : (
                        new Date(acesso.horario).toLocaleString()
                      )}
                    </td>
                    <td className="actions-cell">
                      {editingId === acesso.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button className="btn btn-save" onClick={() => handleSave(acesso.id)}>Salvar</button>
                          <button className="btn btn-cancel" onClick={() => setEditingId(null)}>Cancelar</button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button className="action-btn edit" onClick={() => handleEdit(acesso)} title="Editar">
                            <FaEdit />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(acesso.id)} title="Excluir">
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
