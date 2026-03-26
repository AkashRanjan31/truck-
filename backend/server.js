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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/reports', require('./routes/reports'));
app.use('/api/drivers', require('./routes/drivers'));

app.use(errorHandler);

io.on('connection', (socket) => {
  console.log('Driver connected:', socket.id);
  socket.on('new_report', (data) => socket.broadcast.emit('alert_nearby', data));
  socket.on('emergency', (data) => io.emit('emergency_alert', data));
  socket.on('disconnect', () => console.log('Driver disconnected:', socket.id));
});

app.set('io', io);

connectDB().then(() => {
  server.listen(process.env.PORT || 5000, () =>
    console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
  );
});
