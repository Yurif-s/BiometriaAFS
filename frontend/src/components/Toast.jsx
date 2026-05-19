import { useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle, FaTimes } from "react-icons/fa";

export default function Toast({ message, type = "success", duration = 3500, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // pequeno delay para a animação de entrada disparar
    const showTimer = setTimeout(() => setVisible(true), 20);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 350); // aguarda animação de saída
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

  const isSuccess = type === "success";

  const styles = {
    wrapper: {
      position: "fixed",
      bottom: "32px",
      right: "32px",
      zIndex: 9999,
      transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.96)",
      opacity: visible ? 1 : 0,
      transition: "transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease",
      pointerEvents: visible ? "auto" : "none",
    },
    box: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      background: "#fff",
      borderRadius: "16px",
      padding: "16px 20px",
      minWidth: "280px",
      maxWidth: "380px",
      boxShadow: "0 8px 40px rgba(0,0,0,0.14), 0 2px 10px rgba(0,0,0,0.06)",
      borderLeft: `4px solid ${isSuccess ? "#009245" : "#ff4b4b"}`,
      position: "relative",
      overflow: "hidden",
    },
    icon: {
      fontSize: "22px",
      color: isSuccess ? "#009245" : "#ff4b4b",
      flexShrink: 0,
    },
    text: {
      flex: 1,
      fontSize: "15px",
      fontWeight: 600,
      color: "#222",
      lineHeight: 1.4,
    },
    closeBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#aaa",
      fontSize: "14px",
      padding: "4px",
      display: "flex",
      alignItems: "center",
      flexShrink: 0,
      transition: "color .2s",
    },
    progress: {
      position: "absolute",
      bottom: 0,
      left: 0,
      height: "3px",
      width: "100%",
      background: isSuccess ? "rgba(0,146,69,0.15)" : "rgba(255,75,75,0.15)",
    },
    progressBar: {
      height: "100%",
      background: isSuccess ? "#009245" : "#ff4b4b",
      borderRadius: "0 0 16px 0",
      animation: `toastProgress ${duration}ms linear forwards`,
    },
  };

  return (
    <div style={styles.wrapper}>
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
      <div style={styles.box}>
        <span style={styles.icon}>
          {isSuccess ? <FaCheckCircle /> : <FaTimesCircle />}
        </span>
        <span style={styles.text}>{message}</span>
        <button style={styles.closeBtn} onClick={handleClose} type="button">
          <FaTimes />
        </button>
        <div style={styles.progress}>
          <div style={styles.progressBar} />
        </div>
      </div>
    </div>
  );
}