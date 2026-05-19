import { useState } from "react";
import { FaSearch, FaPen, FaTrash } from "react-icons/fa";

export default function AlunosTable({ alunos, onEdit, onDelete }) {
  const [pesquisa, setPesquisa] = useState("");

  const filtered = alunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <section className="card" id="lista-alunos">
      <section className="search-box">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Pesquisar aluno..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
        />
      </section>

      <h3>Lista de Alunos</h3>

      <table>
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
          {filtered.map((aluno, index) => (
            <tr key={index}>
              <td>{aluno.nome}</td>
              <td>{aluno.matricula}</td>
              <td>{aluno.turma}</td>
              <td>{aluno.digital}</td>
              <td className="acoes">
                <button
                  type="button"
                  className="editar"
                  onClick={() => onEdit(aluno)}
                >
                  <FaPen />
                </button>
                <button
                  type="button"
                  className="excluir"
                  onClick={() => onDelete(aluno)}
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}