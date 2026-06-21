const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const turnosRoutes = require('./routes/turnos');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnosRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Ha ocurrido un error en el servidor.' });
});

app.listen(PORT, () => {
    console.log(`Servidor SGT-CESFAM corriendo en el puerto ${PORT}`);
});
