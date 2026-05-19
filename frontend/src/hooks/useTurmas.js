import { useState, useEffect } from "react";

const turmasDefault = [
  { id: 1, nome: "1ª Informática", ano: 2025 },
  { id: 2, nome: "2ª Informática", ano: 2025 },
  { id: 3, nome: "3º Desenvolvimento de Sistemas", ano: 2025 },
];

export function useTurmas() {
  const [turmas, setTurmas] = useState(() => {
    const saved = localStorage.getItem("turmas");
    return saved ? JSON.parse(saved) : turmasDefault;
  });

  useEffect(() => {
    localStorage.setItem("turmas", JSON.stringify(turmas));
  }, [turmas]);

  const addTurma = (turma) => {
    const nova = {
      id: Date.now(),
      nome: turma.nome.trim(),
      ano: turma.ano,
    };
    setTurmas((prev) => [nova, ...prev]);
    return nova;
  };

  const updateTurma = (id, dados) => {
    setTurmas((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, nome: dados.nome.trim(), ano: Number(dados.ano) } : t
      )
    );
  };

  const deleteTurma = (id) => {
    setTurmas((prev) => prev.filter((t) => t.id !== id));
  };

  const turmaExists = (nome, excludeId = null) =>
    turmas.some(
      (t) =>
        t.nome.toLowerCase() === nome.toLowerCase().trim() &&
        t.id !== excludeId
    );

  const turmaOptions = turmas.map((t) => t.nome);

  return { turmas, turmaOptions, addTurma, updateTurma, deleteTurma, turmaExists };
}