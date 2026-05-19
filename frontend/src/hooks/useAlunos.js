import { useState, useEffect } from "react";
import { initialAlunos, turmaOpcoesDefault } from "../constants/data";

export function useAlunos() {
  const [alunos, setAlunos] = useState(() => {
    const saved = localStorage.getItem("alunos");
    return saved ? JSON.parse(saved) : initialAlunos;
  });

  useEffect(() => {
    localStorage.setItem("alunos", JSON.stringify(alunos));
  }, [alunos]);

  const turmaOptions = [
    ...new Set([...turmaOpcoesDefault, ...alunos.map((a) => a.turma)]),
  ];

  const addAluno = (aluno) => {
    setAlunos((prev) => [aluno, ...prev]);
  };

  const updateAluno = (updated) => {
    setAlunos((prev) =>
      prev.map((a) => (a.matricula === updated.matricula ? updated : a))
    );
  };

  const deleteAluno = (matricula) => {
    setAlunos((prev) => prev.filter((a) => a.matricula !== matricula));
  };

  const matriculaExists = (matricula) =>
    alunos.some((a) => a.matricula === matricula);

  return {
    alunos,
    turmaOptions,
    addAluno,
    updateAluno,
    deleteAluno,
    matriculaExists,
  };
}