// frontend/src/hooks/useTurmas.js
import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export function useTurmas() {
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTurmas = useCallback(async () => {
    try {
      const data = await api.getTurmas();
      setTurmas(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTurmas(); }, [fetchTurmas]);

  const addTurma = async (turma) => {
    const nova = await api.createTurma({
      nome: turma.nome.trim(),
      ano: Number(turma.ano),
    });
    setTurmas(prev => [nova, ...prev]);
    return nova;
  };

  const updateTurma = async (id, dados) => {
    const atualizada = await api.updateTurma(id, {
      nome: dados.nome.trim(),
      ano: Number(dados.ano),
    });
    setTurmas(prev => prev.map(t => t.id === id ? atualizada : t));
  };

  const deleteTurma = async (id) => {
    await api.deleteTurma(id);
    setTurmas(prev => prev.filter(t => t.id !== id));
  };

  const turmaExists = (nome, excludeId = null) =>
    turmas.some(
      t => t.nome.toLowerCase() === nome.toLowerCase().trim() && t.id !== excludeId
    );

  const turmaOptions = turmas.map(t => ({ id: t.id, nome: t.nome }));

  return { turmas, turmaOptions, loading, addTurma, updateTurma, deleteTurma, turmaExists };
}