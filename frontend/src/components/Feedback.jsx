import { FaExclamationCircle, FaInbox, FaRedo } from 'react-icons/fa';
import './Feedback.css';

export default function Feedback({ title, children, error = false, onRetry }) {
  const Icon = error ? FaExclamationCircle : FaInbox;
  return (
    <div className={`feedback-panel${error ? ' is-error' : ''}`} role={error ? 'alert' : 'status'}>
      <span className="feedback-icon"><Icon aria-hidden="true" /></span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {onRetry && <button type="button" className="feedback-retry" onClick={onRetry}>
        <FaRedo aria-hidden="true" /> Tentar novamente
      </button>}
    </div>
  );
}
