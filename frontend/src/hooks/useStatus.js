import { useState, useCallback } from "react";

export function useStatus() {
  const [statusMessage, setStatusMessage] = useState("");
  const [showStatus, setShowStatus] = useState(false);

  const showMsg = useCallback((msg, autoDismiss = 3000) => {
    setStatusMessage(msg);
    setShowStatus(true);
    if (autoDismiss) {
      setTimeout(() => setShowStatus(false), autoDismiss);
    }
  }, []);

  const hideStatus = useCallback(() => {
    setShowStatus(false);
    setStatusMessage("");
  }, []);

  return { statusMessage, showStatus, showMsg, hideStatus };
}