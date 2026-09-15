import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api';

export function useWebSocket(onBiometriaLida, onBiometriaFalha) {
  const [connection, setConnection] = useState('connecting');
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
    const handleConnect = () => setConnection('connected');
    const handleDisconnect = () => setConnection('disconnected');
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleDisconnect);

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
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleDisconnect);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);
  return connection;
}
