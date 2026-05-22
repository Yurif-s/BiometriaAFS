import { useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

let socket = null;

export function useWebSocket(onBiometriaLida) {
  useEffect(() => {
    socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3000');

    socket.on('biometria-lida', (data) => {
      // data = { biometriaId: number, alunoNome?: string }
      onBiometriaLida(data);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [onBiometriaLida]);
}