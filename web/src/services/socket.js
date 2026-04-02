import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (driverId) => {
  if (socket?.connected) {
    if (driverId) socket.emit('register_driver', driverId);
    return socket;
  }
  socket = io('http://localhost:5000', {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });
  socket.on('connect', () => {
    if (driverId) socket.emit('register_driver', driverId);
  });
  return socket;
};

export const getSocket = () => socket;
export const emitNewReport = (report) => socket?.emit('new_report', report);
export const emitEmergency = (data) => socket?.emit('emergency', data);
