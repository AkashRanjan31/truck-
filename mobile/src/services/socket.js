import { io } from 'socket.io-client';

const SOCKET_URL = 'http://192.168.1.41:5000';

let socket = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => console.log('Socket connected'));
  socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.log('Socket error:', err.message));

  return socket;
};

export const getSocket = () => socket;
export const emitNewReport = (report) => socket?.emit('new_report', report);
export const emitEmergency = (data) => socket?.emit('emergency', data);
export const disconnectSocket = () => socket?.disconnect();
