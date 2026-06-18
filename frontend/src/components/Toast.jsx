import { useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle, FaTimes } from "react-icons/fa";

export default function Toast({ message, type = "success", duration = 3500, onClose }) {
  const [visible, setVisible] = useState(false);
  const isSuccess = type === "success";

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 20);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 350);
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 350);
  };

  return (
    <div className={`toast-wrapper${visible ? " visible" : ""}`} role="status" aria-live="polite">
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
      <div className={`toast-box ${isSuccess ? "success" : "error"}`}>
        <span className={`toast-icon ${isSuccess ? "success" : "error"}`}>
          {isSuccess ? <FaCheckCircle /> : <FaTimesCircle />}
        </span>
        <span className="toast-text">{message}</span>
        <button className="toast-close-btn" onClick={handleClose} type="button" aria-label="Fechar notificação">
          <FaTimes />
        </button>
        <div className={`toast-progress ${isSuccess ? "success" : "error"}`}>
          <div
            className={`toast-progress-bar ${isSuccess ? "success" : "error"}`}
            style={{ animation: `toastProgress ${duration}ms linear forwards` }}
          />
        </div>
      </div>
    </div>
  );
}
