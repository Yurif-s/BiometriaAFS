import React, { useEffect, useState } from "react";
import { FaHistory, FaTrash, FaEdit, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useAcessos } from "../hooks/useAcessos";
import FiltrosAcesso from "../components/dashboard/FiltrosAcesso";
import ExportButton from "../components/dashboard/ExportButton";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import "./HistoricoPage.css";

export default function HistoricoPage({ showToast }) {
  const {
    paginatedAcessos,
    totalPages,
    totalItems,
    loading,
    fetchAcessosFiltrados,
    updateAcesso,
    deleteAcesso
  } = useAcessos();

  const [filters, setFilters] = useState({
    dataInicio: "",
    dataFim: "",
    turmaId: "",
    tipo: "",
    busca: ""
  });
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchAcessosFiltrados({ ...filters, page, limit });
  }, [filters, page, fetchAcessosFiltrados]);

  const handleFilter = (newFilters) => {
    // Normalizar strings vazias
    const cleaned = {};
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key] !== "") {
        cleaned[key] = newFilters[key];
      }
    });
    setFilters(cleaned);
    setPage(1);
  };

  const handleClear = () => {
    setFilters({
      dataInicio: "",
      dataFim: "",
      turmaId: "",
      tipo: "",
      busca: ""
    });
    setPage(1);
  };

  // Edição inline
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ tipo: "", horario: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleEdit = (acesso) => {
    setEditingId(acesso.id);
    const date = new Date(acesso.horario);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    setEditForm({
      tipo: acesso.tipo,
      horario: date.toISOString().slice(0, 16)
    });
  };

  const handleSave = async (id) => {
    try {
      await updateAcesso(id, {
        tipo: editForm.tipo,
        horario: new Date(editForm.horario).toISOString(),
      });
      showToast("Acesso atualizado com sucesso!");
      setEditingId(null);
    } catch (err) {
      showToast("Erro ao atualizar acesso.", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteAcesso(deleteTarget.id);
      showToast("Acesso removido com sucesso!");
      setDeleteTarget(null);
    } catch (err) {
      showToast("Erro ao remover acesso.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="historico-page">
      <div className="historico-header">
        <div className="title-with-icon">
          <FaHistory className="page-icon" />
          <h2>Histórico de Acessos</h2>
        </div>
      </div>

      <FiltrosAcesso onFilter={handleFilter} onClear={handleClear} />

      <div className="historico-actions-bar">
        <div className="total-items">
          Total de registros encontrados: <strong>{totalItems}</strong>
        </div>
        <ExportButton
          filters={filters}
          filename={`historico_acessos_${new Date().toISOString().slice(0, 10)}.csv`}
          onError={showToast}
        />
      </div>

      <div className="table-container-card">
        {loading ? (
          <div className="table-loading">
            <div className="spinner"></div>
            <p>Carregando histórico...</p>
          </div>
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
              {paginatedAcessos.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                    Nenhum acesso registrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedAcessos.map((acesso) => (
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
                      <span className="turma-badge">{acesso.aluno.turma?.nome || "Sem Turma"}</span>
                    </td>
                    <td>
                      {editingId === acesso.id ? (
                        <select
                          className="form-input-table"
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
                          className="form-input-table"
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
                          <button className="btn btn-cancel" onClick={() => setEditingId(null)}>Voltar</button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button className="action-btn edit" onClick={() => handleEdit(acesso)} title="Editar" aria-label="Editar acesso">
                            <FaEdit aria-hidden="true" />
                          </button>
                          <button className="action-btn delete" onClick={() => setDeleteTarget(acesso)} title="Excluir" aria-label="Excluir acesso">
                            <FaTrash aria-hidden="true" />
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

      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            className="pagination-btn"
            disabled={page === 1 || loading}
            onClick={() => setPage(p => Math.max(p - 1, 1))}
          >
            <FaChevronLeft /> Anterior
          </button>
          <span className="pagination-info">
            Página <strong>{page}</strong> de <strong>{totalPages}</strong>
          </span>
          <button
            className="pagination-btn"
            disabled={page === totalPages || loading}
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
          >
            Próximo <FaChevronRight />
          </button>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          target={deleteTarget}
          loading={deleteLoading}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          type="acesso"
        />
      )}
    </div>
  );
}
