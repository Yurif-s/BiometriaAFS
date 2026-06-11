import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Turmas
export const getTurmas = () => api.get('/turmas').then(r => r.data);
export const createTurma = (data) => api.post('/turmas', data).then(r => r.data);
export const updateTurma = (id, data) => api.put(`/turmas/${id}`, data).then(r => r.data);
export const deleteTurma = (id) => api.delete(`/turmas/${id}`);

// Alunos
export const getAlunos = () => api.get('/alunos').then(r => r.data);
export const createAluno = (data) => api.post('/alunos', data).then(r => r.data);
export const updateAluno = (id, data) => api.put(`/alunos/${id}`, data).then(r => r.data);
export const deleteAluno = (id) => api.delete(`/alunos/${id}`);

// Acessos
export const getAcessosHoje = () => api.get('/acessos/hoje').then(r => r.data);
export const getTodosAcessos = () => api.get('/acessos').then(r => r.data);
export const updateAcesso = (id, data) => api.put(`/acessos/${id}`, data).then(r => r.data);
export const deleteAcesso = (id) => api.delete(`/acessos/${id}`);

// Dashboard endpoints
export const getDashboardResumo = () => api.get('/dashboard/resumo').then(r => r.data);
export const getDashboardPorHora = (data) => api.get('/dashboard/acessos/por-hora', { params: { data } }).then(r => r.data);
export const getDashboardTendencia = (dias) => api.get('/dashboard/tendencia', { params: { dias } }).then(r => r.data);
export const getDashboardAcessos = (params) => api.get('/dashboard/acessos', { params }).then(r => r.data);
export const getDashboardFrequenciaTurma = (turmaId, data) => api.get(`/dashboard/turmas/${turmaId}/frequencia`, { params: { data } }).then(r => r.data);
export const getDashboardExportCsv = (params) => api.get('/dashboard/export', { params, responseType: 'text' }).then(r => r.data);

// Biometria
export const iniciarCadastroBiometria = () => api.post('/alunos/biometria/iniciar-cadastro').then(r => r.data);
export const cancelarCadastroBiometria = (id, reason = 'unknown') =>
  api.post('/alunos/biometria/cancelar-cadastro', { id: Number(id), reason }).then(r => r.data);
