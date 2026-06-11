import { useState, useEffect, useCallback } from 'react';
import * as apiService from '../services/api';

export function useDashboard(pollingIntervalMs = 30000) {
  const [resumo, setResumo] = useState(null);
  const [porHora, setPorHora] = useState([]);
  const [tendencia, setTendencia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResumo = useCallback(async () => {
    try {
      const data = await apiService.getDashboardResumo();
      setResumo(data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar resumo do dashboard", err);
      setError(err);
    }
  }, []);

  const fetchPorHora = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const data = await apiService.getDashboardPorHora(todayStr);
      setPorHora(data);
    } catch (err) {
      console.error("Erro ao buscar acessos por hora", err);
    }
  }, []);

  const fetchTendencia = useCallback(async () => {
    try {
      const data = await apiService.getDashboardTendencia(7);
      setTendencia(data);
    } catch (err) {
      console.error("Erro ao buscar tendência de acessos", err);
    }
  }, []);

  const fetchAll = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    await Promise.all([fetchResumo(), fetchPorHora(), fetchTendencia()]);
    setLoading(false);
  }, [fetchResumo, fetchPorHora, fetchTendencia]);

  // Initial load
  useEffect(() => {
    fetchAll(true);
  }, [fetchAll]);

  // Polling
  useEffect(() => {
    if (!pollingIntervalMs) return;
    const timer = setInterval(() => {
      fetchAll(false);
    }, pollingIntervalMs);
    return () => clearInterval(timer);
  }, [fetchAll, pollingIntervalMs]);

  return {
    resumo,
    porHora,
    tendencia,
    loading,
    error,
    refresh: () => fetchAll(true),
  };
}
