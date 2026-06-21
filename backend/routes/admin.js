const express = require('express');
const db = require('../db');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const router = express.Router();

// Middleware para proteger todas las rutas de este archivo
router.use(verifyToken);
router.use(checkRole(['Administrativo', 'Jefatura']));

// GET /api/admin/agenda-diaria
// Obtiene todos los turnos para el día actual
router.get('/agenda-diaria', (req, res) => {
    // Para SQLite tomaremos turnos que coincidan con la fecha actual
    // Usamos datetime('now', 'localtime')
    const query = `
        SELECT 
            t.id, t.fecha_hora, t.estado, 
            p.nombre AS profesional, e.nombre AS especialidad,
            pac.nombre AS paciente_nombre, pac.rut AS paciente_rut
        FROM turnos t
        JOIN usuarios p ON t.id_profesional = p.id
        JOIN especialidades e ON t.id_especialidad = e.id
        LEFT JOIN usuarios pac ON t.id_paciente = pac.id
        WHERE date(t.fecha_hora) = date('now', 'localtime')
        ORDER BY t.fecha_hora ASC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al buscar la agenda diaria' });
        }
        res.json(rows);
    });
});

// POST /api/admin/asignar (RF-09)
// Asigna manualmente un bloque a un paciente buscado por RUT
router.post('/asignar', (req, res) => {
    const { rut, turnoId } = req.body;

    if (!rut || !turnoId) {
        return res.status(400).json({ error: 'RUT y ID de turno son requeridos' });
    }

    // Buscar al paciente por RUT
    db.get(`SELECT id, rol FROM usuarios WHERE rut = ? AND rol = 'Paciente'`, [rut], (err, paciente) => {
        if (err) {
            return res.status(500).json({ error: 'Error al buscar al paciente' });
        }
        if (!paciente) {
            return res.status(404).json({ error: 'Paciente no encontrado o no válido en el sistema.' });
        }

        // Ejecutar asignación manual atómica
        const stmt = db.prepare(`
            UPDATE turnos 
            SET estado = 'Agendado', id_paciente = ? 
            WHERE id = ? AND estado = 'Libre'
        `);

        stmt.run([paciente.id, turnoId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error al procesar la reserva manual' });
            }
            if (this.changes === 0) {
                return res.status(409).json({ error: 'El bloque seleccionado ya no se encuentra Libre.' });
            }

            res.json({ message: 'Turno asignado correctamente desde mesón.' });
        });
        stmt.finalize();
    });
});

// PUT /api/admin/check-in/:id (RF-10, RF-11)
// Control de admisión y alerta visual clínica
router.put('/check-in/:id', (req, res) => {
    const turnoId = req.params.id;

    // Primero verificamos el turno para obtener al id del profesional y notificarle
    db.get(`
        SELECT t.id, t.estado, t.id_profesional, pac.nombre AS paciente_nombre
        FROM turnos t
        JOIN usuarios pac ON t.id_paciente = pac.id
        WHERE t.id = ? AND t.estado = 'Agendado'
    `, [turnoId], (err, turno) => {
        if (err) return res.status(500).json({ error: 'Error de base de datos' });
        if (!turno) return res.status(404).json({ error: 'Turno no encontrado o no está en estado "Agendado"' });

        // Actualizar estado a "Presente"
        db.run(`UPDATE turnos SET estado = 'Presente' WHERE id = ?`, [turnoId], function(err) {
            if (err) return res.status(500).json({ error: 'Error al actualizar el estado' });
            
            // RF-11: Emitir alerta visual clínica al box mediante Socket.io
            if (req.io) {
                const roomName = `profesional_${turno.id_profesional}`;
                req.io.to(roomName).emit('nuevo_check_in', {
                    turnoId: turno.id,
                    mensaje: `El paciente ${turno.paciente_nombre} ha llegado a la sala de espera.`
                });
            }

            res.json({ message: 'Check-in realizado correctamente' });
        });
    });
});

module.exports = router;
