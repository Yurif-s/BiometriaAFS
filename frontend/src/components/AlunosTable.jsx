import { useState } from "react";
import { FaSearch, FaPen, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function AlunosTable({ alunos, onEdit, onDelete }) {
  const [pesquisa, setPesquisa] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = alunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
    aluno.matricula.toLowerCase().includes(pesquisa.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAlunos = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (e) => {
    setPesquisa(e.target.value);
    setCurrentPage(1);
  };

  return (
    <section className="card" id="lista-alunos">
      <section className="search-box" role="search" aria-label="Pesquisar alunos">
        <FaSearch className="search-icon" aria-hidden="true" />
        <label htmlFor="pesquisa-alunos" className="sr-only">Pesquisar aluno</label>
        <input
          id="pesquisa-alunos"
          type="text"
          placeholder="Pesquisar aluno por nome ou matrícula..."
          value={pesquisa}
          onChange={handleSearch}
        />
      </section>

      <h3>Lista de Alunos ({filtered.length})</h3>

      <table>
        <caption className="sr-only">Lista de alunos cadastrados</caption>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Matrícula</th>
            <th>Turma</th>
            <th>ID da Digital</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {paginatedAlunos.map((aluno, index) => (
            <tr key={aluno.id || index}>
              <td>{aluno.nome}</td>
              <td>{aluno.matricula}</td>
              <td>{aluno.turma?.nome ?? aluno.turma ?? "Sem Turma"}</td>
              <td>{aluno.biometria}</td>
              <td className="acoes">
                <button
                  type="button"
                  className="editar"
                  onClick={() => onEdit(aluno)}
                  aria-label={`Editar aluno ${aluno.nome}`}
                >
                  <FaPen aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="excluir"
                  onClick={() => onDelete(aluno)}
                  aria-label={`Excluir aluno ${aluno.nome}`}
                >
                  <FaTrash aria-hidden="true" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', color: '#475569' }}
          >
            <FaChevronLeft /> Anterior
          </button>
          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Página <strong style={{ color: '#1e293b' }}>{currentPage}</strong> de <strong style={{ color: '#1e293b' }}>{totalPages}</strong>
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '4px', color: '#475569' }}
          >
            Próximo <FaChevronRight />
          </button>
        </div>
      )}
    </section>
  );
}
