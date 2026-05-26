import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socket = null;

export function useWebSocket(onBiometriaLida, onBiometriaFalha) {
  const onBiometriaLidaRef = useRef(onBiometriaLida);
  const onBiometriaFalhaRef = useRef(onBiometriaFalha);

  // Manter as refs atualizadas sem causar re-render do useEffect
  useEffect(() => {
    onBiometriaLidaRef.current = onBiometriaLida;
  }, [onBiometriaLida]);

  useEffect(() => {
    onBiometriaFalhaRef.current = onBiometriaFalha;
  }, [onBiometriaFalha]);

  useEffect(() => {
    socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    socket.on('biometria-lida', (data) => {
      if (onBiometriaLidaRef.current) onBiometriaLidaRef.current(data);
    });

    socket.on('biometria-falha', () => {
      if (onBiometriaFalhaRef.current) onBiometriaFalhaRef.current();
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, []); // Roda apenas uma vez na montagem
}