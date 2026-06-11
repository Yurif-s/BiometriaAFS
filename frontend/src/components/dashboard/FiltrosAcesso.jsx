import React, { useEffect, useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { getTurmas } from "../../services/api";
import "./FiltrosAcesso.css";

export default function FiltrosAcesso({ onFilter, onClear }) {
  const [turmas, setTurmas] = useState([]);
  const [filters, setFilters] = useState({
    dataInicio: "",
    dataFim: "",
    turmaId: "",
    tipo: "",
    busca: ""
  });

  useEffect(() => {
    getTurmas().then(setTurmas).catch(console.error);
  }, []);

  const handleChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    if (field !== "busca") {
      onFilter(newFilters);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  const handleClear = () => {
    const cleared = {
      dataInicio: "",
      dataFim: "",
      turmaId: "",
      tipo: "",
      busca: ""
    };
    setFilters(cleared);
    onClear();
  };

  return (
    <form className="filtros-acesso-form" onSubmit={handleSubmit}>
      <div className="filtros-grid">
        <div className="filtro-item">
          <label>Data Início</label>
          <input
            type="date"
            className="filtro-input"
            value={filters.dataInicio}
            onChange={(e) => handleChange("dataInicio", e.target.value)}
          />
        </div>
        <div className="filtro-item">
          <label>Data Fim</label>
          <input
            type="date"
            className="filtro-input"
            value={filters.dataFim}
            onChange={(e) => handleChange("dataFim", e.target.value)}
          />
        </div>
        <div className="filtro-item">
          <label>Turma</label>
          <select
            className="filtro-select"
            value={filters.turmaId}
            onChange={(e) => handleChange("turmaId", e.target.value)}
          >
            <option value="">Todas</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="filtro-item">
          <label>Tipo</label>
          <select
            className="filtro-select"
            value={filters.tipo}
            onChange={(e) => handleChange("tipo", e.target.value)}
          >
            <option value="">Todos</option>
            <option value="Entrada">Entrada</option>
            <option value="Saída">Saída</option>
          </select>
        </div>
        <div className="filtro-item busca-item">
          <label>Buscar</label>
          <div className="busca-input-container">
            <input
              type="text"
              placeholder="Nome ou Matrícula..."
              className="filtro-input-busca"
              value={filters.busca}
              onChange={(e) => handleChange("busca", e.target.value)}
            />
            <button type="submit" className="btn-busca-submit">
              <FaSearch />
            </button>
          </div>
        </div>
      </div>
      <div className="filtros-actions">
        <button type="button" className="btn-clear-filtros" onClick={handleClear}>
          <FaTimes /> Limpar Filtros
        </button>
      </div>
    </form>
  );
}
