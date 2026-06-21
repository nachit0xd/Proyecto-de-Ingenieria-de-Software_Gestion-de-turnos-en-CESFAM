const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const turnosRoutes = require('./routes/turnos');
const adminRoutes = require('./routes/admin');
const clinicoRoutes = require('./routes/clinico');
const jefaturaRoutes = require('./routes/jefatura');

const app = express();
const server = http.createServer(app);

// Configuración de Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // En producción debería restringirse al dominio del frontend
    methods: ['GET', 'POST', 'PUT']
  }
});

const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Inyectar io en req para poder usarlo en las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clinico', clinicoRoutes);
app.use('/api/jefatura', jefaturaRoutes);

// Manejo de websockets
io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado:', socket.id);
  
  // El médico puede unirse a una "sala" (room) con su propio ID para escuchar alertas
  socket.on('join_profesional_room', (profesionalId) => {
    socket.join(`profesional_${profesionalId}`);
    console.log(`Socket ${socket.id} unido a la sala: profesional_${profesionalId}`);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Ha ocurrido un error en el servidor.' });
});

server.listen(PORT, () => {
    console.log(`Servidor SGT-CESFAM corriendo en el puerto ${PORT}`);
});
