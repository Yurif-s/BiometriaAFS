import React from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { HORARIOS_AULAS } from "../../constants/horariosAulas";
import "./PeriodoTable.css";

export default function PeriodoTable({ data = [] }) {
  return (
    <div className="table-container">
      <table className="alunos-table period-table">
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Status</th>
            <th>Entrada</th>
            <th>Saída</th>
            {HORARIOS_AULAS.map((a) => (
              <th 
                key={a.periodo} 
                title={`${a.periodo}º Período: ${a.inicio} - ${a.fim}`} 
                className="period-header"
              >
                P{a.periodo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={13} style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                Nenhum aluno matriculado nesta turma ou sem registros de presença.
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.alunoId}>
                <td>
                  <div className="aluno-info">
                    <div className="aluno-avatar">{row.nome.charAt(0)}</div>
                    <div>
                      <div className="aluno-nome">{row.nome}</div>
                      <div className="aluno-matricula">RA: {row.matricula}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${
                    row.status === 'Presente' ? 'active' : row.status === 'Saiu' ? 'warning' : 'inactive'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td>{row.entrada || "--"}</td>
                <td>{row.saida || "--"}</td>
                {HORARIOS_AULAS.map((a) => {
                  const isAusente = row.periodosAusentes.includes(a.periodo);
                  return (
                    <td key={a.periodo} className="period-cell" style={{ textAlign: "center" }}>
                      {isAusente ? (
                        <div className="period-dot absent" title={`Ausente no ${a.periodo}º Período (${a.inicio} - ${a.fim})`}>
                          <FaTimes />
                        </div>
                      ) : (
                        <div className="period-dot present" title={`Presente no ${a.periodo}º Período (${a.inicio} - ${a.fim})`}>
                          <FaCheck />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
