import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // ajuste se a porta for diferente
});

export function useAcessos() {
  const [acessosHoje, setAcessosHoje] = useState([]);
  const [todosAcessos, setTodosAcessos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAcessosHoje = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/acessos/hoje');
      setAcessosHoje(data);
      setError(null);
    } catch (err) {
      setError(err);
      console.error('Erro ao buscar acessos de hoje', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTodosAcessos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/acessos');
      setTodosAcessos(data);
      setError(null);
    } catch (err) {
      setError(err);
      console.error('Erro ao buscar todos os acessos', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAcesso = async (id, payload) => {
    try {
      const { data } = await api.put(`/acessos/${id}`, payload);
      setTodosAcessos(prev => prev.map(a => a.id === id ? data : a));
      setAcessosHoje(prev => prev.map(a => a.id === id ? data : a));
      return data;
    } catch (err) {
      console.error('Erro ao atualizar acesso', err);
      throw err;
    }
  };

  const deleteAcesso = async (id) => {
    try {
      await api.delete(`/acessos/${id}`);
      setTodosAcessos(prev => prev.filter(a => a.id !== id));
      setAcessosHoje(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Erro ao deletar acesso', err);
      throw err;
    }
  };

  return {
    acessosHoje,
    todosAcessos,
    loading,
    error,
    fetchAcessosHoje,
    fetchTodosAcessos,
    updateAcesso,
    deleteAcesso,
  };
}
