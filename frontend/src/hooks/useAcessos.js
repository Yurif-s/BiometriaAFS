import { useState, useCallback } from 'react';
import * as apiService from '../services/api';

export function useAcessos() {
  const [acessosHoje, setAcessosHoje] = useState([]);
  const [todosAcessos, setTodosAcessos] = useState([]);
  const [paginatedAcessos, setPaginatedAcessos] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAcessosHoje = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getAcessosHoje();
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
      const data = await apiService.getTodosAcessos();
      setTodosAcessos(data);
      setError(null);
    } catch (err) {
      setError(err);
      console.error('Erro ao buscar todos os acessos', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAcessosFiltrados = useCallback(async (filters) => {
    setLoading(true);
    try {
      const data = await apiService.getDashboardAcessos(filters);
      setPaginatedAcessos(data.data);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
      setError(null);
    } catch (err) {
      setError(err);
      console.error('Erro ao buscar acessos filtrados', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAcesso = async (id, payload) => {
    try {
      const data = await apiService.updateAcesso(id, payload);
      setTodosAcessos(prev => prev.map(a => a.id === id ? data : a));
      setAcessosHoje(prev => prev.map(a => a.id === id ? data : a));
      setPaginatedAcessos(prev => prev.map(a => a.id === id ? data : a));
      return data;
    } catch (err) {
      console.error('Erro ao atualizar acesso', err);
      throw err;
    }
  };

  const deleteAcesso = async (id) => {
    try {
      await apiService.deleteAcesso(id);
      setTodosAcessos(prev => prev.filter(a => a.id !== id));
      setAcessosHoje(prev => prev.filter(a => a.id !== id));
      setPaginatedAcessos(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Erro ao deletar acesso', err);
      throw err;
    }
  };

  return {
    acessosHoje,
    todosAcessos,
    paginatedAcessos,
    totalPages,
    totalItems,
    loading,
    error,
    fetchAcessosHoje,
    fetchTodosAcessos,
    fetchAcessosFiltrados,
    updateAcesso,
    deleteAcesso,
  };
}
