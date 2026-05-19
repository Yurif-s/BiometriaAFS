import { useState, useEffect } from "react";

const initialAlunos = [
  {
    nome: "Maria Eduarda Silva",
    matricula: "2025001",
    turma: "1ª Informática",
    digital: "12345",
  },
  {
    nome: "João Pedro Santos",
    matricula: "2025002",
    turma: "1ª Informática",
    digital: "12346",
  },
  {
    nome: "Ana Beatriz Lima",
    matricula: "2025003",
    turma: "2ª Informática",
    digital: "12347",
  },
];

export function useAlunos() {
  const [alunos, setAlunos] = useState(() => {
    const saved = localStorage.getItem("alunos");
    return saved ? JSON.parse(saved) : initialAlunos;
  });

  useEffect(() => {
    localStorage.setItem("alunos", JSON.stringify(alunos));
  }, [alunos]);

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

  return { alunos, addAluno, updateAluno, deleteAluno, matriculaExists };
}