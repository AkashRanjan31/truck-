import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;
  socket = io('http://localhost:5000', {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });
  return socket;
};

export const getSocket = () => socket;
export const emitNewReport = (report) => socket?.emit('new_report', report);
export const emitEmergency = (data) => socket?.emit('emergency', data);
