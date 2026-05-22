import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export function useAlunos() {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlunos = useCallback(async () => {
    try {
      const data = await api.getAlunos();
      setAlunos(data);
    } catch (err) {
      console.error("Erro ao buscar alunos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlunos(); }, [fetchAlunos]);

  const addAluno = async (dto) => {
    const novo = await api.createAluno(dto);
    setAlunos(prev => [novo, ...prev]);
    return novo;
  };

  const updateAluno = async (id, dto) => {
    const atualizado = await api.updateAluno(id, dto);
    setAlunos(prev => prev.map(a => a.id === id ? atualizado : a));
  };

  const deleteAluno = async (id) => {
    await api.deleteAluno(id);
    setAlunos(prev => prev.filter(a => a.id !== id));
  };

  const matriculaExists = useCallback((matricula, excludeId = null) => {
    return alunos.some(
      a => a.matricula.trim() === matricula.trim() && a.id !== excludeId
    );
  }, [alunos]);

  return { alunos, loading, addAluno, updateAluno, deleteAluno, matriculaExists, refetch: fetchAlunos };
}