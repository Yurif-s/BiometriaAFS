import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api';

export function useWebSocket(onBiometriaLida, onBiometriaFalha) {
  const socketRef = useRef(null);
  const onBiometriaLidaRef = useRef(onBiometriaLida);
  const onBiometriaFalhaRef = useRef(onBiometriaFalha);

  useEffect(() => {
    onBiometriaLidaRef.current = onBiometriaLida;
  }, [onBiometriaLida]);

  useEffect(() => {
    onBiometriaFalhaRef.current = onBiometriaFalha;
  }, [onBiometriaFalha]);

  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    const handleBiometriaLida = (data) => {
      if (onBiometriaLidaRef.current) onBiometriaLidaRef.current(data);
    };

    const handleBiometriaFalha = () => {
      if (onBiometriaFalhaRef.current) onBiometriaFalhaRef.current();
    };

    socket.on('biometria-lida', handleBiometriaLida);
    socket.on('biometria-falha', handleBiometriaFalha);

    return () => {
      socket.off('biometria-lida', handleBiometriaLida);
      socket.off('biometria-falha', handleBiometriaFalha);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);
}
