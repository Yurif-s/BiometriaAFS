import { useState, useCallback } from "react";

/**
 * useToast — gerencia o estado do Toast.
 *
 * Retorna:
 *  - toast        : { message, type } | null
 *  - showToast(msg, type?, duration?) : exibe o toast
 *  - hideToast()  : esconde
 */
export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success", duration = 3500) => {
    // força re-render mesmo se a msg for igual
    setToast(null);
    setTimeout(() => setToast({ message, type, duration }), 10);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}