import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = (driverId) => {
  // If socket exists and is connected, just register driver if needed
  if (socket?.connected) {
    if (driverId) socket.emit('register_driver', driverId);
    return socket;
  }

  // If socket exists but disconnected, clean it up
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    if (driverId) socket.emit('register_driver', driverId);
  });

  socket.on('reconnect', () => {
    if (driverId) socket.emit('register_driver', driverId);
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;
export const emitNewReport = (report) => socket?.emit('new_report', report);
export const emitEmergency = (data) => socket?.emit('emergency', data);
