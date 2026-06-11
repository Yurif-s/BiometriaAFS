import React from "react";
import { FaGraduationCap } from "react-icons/fa";
import "./TurmaRanking.css";

export default function TurmaRanking({ data = [] }) {
  const maxCount = data.length > 0 ? Math.max(...data.map(d => d.count)) : 1;

  return (
    <div className="turma-ranking-card">
      <div className="card-header-ranking">
        <div className="title-with-status">
          <FaGraduationCap className="ranking-icon" />
          <h3>Movimentação por Turma</h3>
        </div>
      </div>
      <div className="ranking-list">
        {data.length === 0 ? (
          <div className="empty-ranking">Sem movimentação registrada hoje.</div>
        ) : (
          data.map((item, index) => {
            const pct = (item.count / maxCount) * 100;
            return (
              <div key={item.name} className="ranking-item">
                <div className="ranking-header-row">
                  <div className="ranking-name-section">
                    <span className="ranking-position">#{index + 1}</span>
                    <span className="ranking-name">{item.name}</span>
                  </div>
                  <span className="ranking-count">{item.count} {item.count === 1 ? 'movimento' : 'movimentos'}</span>
                </div>
                <div className="ranking-bar-bg">
                  <div className="ranking-bar-fill" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
