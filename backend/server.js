require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/states', require('./routes/states'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/trucks', require('./routes/trucks'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/reports', require('./routes/reports'));

app.use(errorHandler);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Admins join their state room to receive state-specific events
  socket.on('join_state', (stateId) => {
    socket.join(`state_${stateId}`);
    console.log(`Socket ${socket.id} joined state_${stateId}`);
  });

  socket.on('new_report', (data) => socket.broadcast.emit('alert_nearby', data));
  socket.on('emergency', (data) => {
    io.emit('emergency_alert', data);
    if (data.stateId) io.to(`state_${data.stateId}`).emit('state_emergency', data);
  });
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

app.set('io', io);

connectDB().then(() => {
  server.listen(process.env.PORT || 5000, '0.0.0.0', () =>
    console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
  );
}).catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
