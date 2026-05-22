import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
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