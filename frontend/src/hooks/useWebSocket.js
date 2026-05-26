import { useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

let socket = null;

export function useWebSocket(onBiometriaLida, onBiometriaFalha) {
  useEffect(() => {
    socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3000');

    socket.on('biometria-lida', (data) => {
      // data = { biometriaId: number, alunoNome?: string, ... }
      if (onBiometriaLida) onBiometriaLida(data);
    });

    socket.on('biometria-falha', () => {
      if (onBiometriaFalha) onBiometriaFalha();
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [onBiometriaLida, onBiometriaFalha]);
}