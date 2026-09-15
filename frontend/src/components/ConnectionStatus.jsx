import './ConnectionStatus.css';

export default function ConnectionStatus({ connection }) {
  const labels = { connected: 'Atualizações conectadas', connecting: 'Conectando…', disconnected: 'Sem conexão ao vivo' };
  return (
    <span className={`connection-status ${connection}`} role="status">
      <span className="connection-dot" aria-hidden="true" />
      {labels[connection]}
    </span>
  );
}
