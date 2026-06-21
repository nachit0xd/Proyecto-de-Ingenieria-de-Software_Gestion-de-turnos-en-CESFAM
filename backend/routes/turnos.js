const express = require('express');
const db = require('../db');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const router = express.Router();

// GET /api/turnos/disponibles (RF-03, RF-04)
router.get('/disponibles', verifyToken, (req, res) => {
    // Parámetros opcionales
    const { especialidad, profesional } = req.query;

    let query = `
        SELECT t.id, t.fecha_hora, u.nombre AS profesional, e.nombre AS especialidad
        FROM turnos t
        JOIN usuarios u ON t.id_profesional = u.id
        JOIN especialidades e ON t.id_especialidad = e.id
        WHERE t.estado = 'Libre' AND t.fecha_hora > datetime('now', 'localtime')
    `;
    const params = [];

    if (especialidad) {
        query += ` AND e.nombre LIKE ?`;
        params.push(`%${especialidad}%`);
    }
    
    if (profesional) {
        query += ` AND u.nombre LIKE ?`;
        params.push(`%${profesional}%`);
    }

    query += ` ORDER BY t.fecha_hora ASC`;

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al buscar turnos disponibles' });
        }
        res.json(rows);
    });
});

// POST /api/turnos/reservar (RF-05) - Control Transaccional (RNF-02)
router.post('/reservar', verifyToken, (req, res) => {
    const { turnoId } = req.body;
    const pacienteId = req.user.id;

    if (!turnoId) {
        return res.status(400).json({ error: 'ID de turno requerido' });
    }

    // SQLite ejecuta el UPDATE atómicamente. Si el turno ya fue tomado (estado != 'Libre'), changes = 0.
    const stmt = db.prepare(`
        UPDATE turnos 
        SET estado = 'Agendado', id_paciente = ? 
        WHERE id = ? AND estado = 'Libre'
    `);

    stmt.run([pacienteId, turnoId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error al procesar la reserva' });
        }
        
        // this.changes contiene el número de filas afectadas
        if (this.changes === 0) {
            return res.status(409).json({ error: 'El bloque seleccionado ya no se encuentra disponible. Por favor, elija otra opción del calendario.' });
        }

        res.json({ message: 'Turno reservado exitosamente' });
    });
    stmt.finalize();
});

// GET /api/turnos/mis-turnos (RF-08)
router.get('/mis-turnos', verifyToken, (req, res) => {
    const pacienteId = req.user.id;

    const query = `
        SELECT t.id, t.fecha_hora, t.estado, u.nombre AS profesional, e.nombre AS especialidad
        FROM turnos t
        JOIN usuarios u ON t.id_profesional = u.id
        JOIN especialidades e ON t.id_especialidad = e.id
        WHERE t.id_paciente = ?
        ORDER BY t.fecha_hora DESC
    `;

    db.all(query, [pacienteId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cargar el historial' });
        }
        res.json(rows);
    });
});

// PUT /api/turnos/cancelar/:id (RF-06)
router.put('/cancelar/:id', verifyToken, (req, res) => {
    const turnoId = req.params.id;
    const pacienteId = req.user.id;

    // Obtener el turno para verificar la regla de las 24 horas
    db.get(`SELECT fecha_hora FROM turnos WHERE id = ? AND id_paciente = ? AND estado = 'Agendado'`, [turnoId, pacienteId], (err, turno) => {
        if (err) {
            return res.status(500).json({ error: 'Error al buscar el turno' });
        }
        if (!turno) {
            return res.status(404).json({ error: 'Turno no encontrado o no puede ser cancelado' });
        }

        const fechaTurno = new Date(turno.fecha_hora);
        const ahora = new Date();
        const diffHoras = (fechaTurno - ahora) / (1000 * 60 * 60);

        if (diffHoras < 24) {
            return res.status(400).json({ error: 'No es posible reprogramar de forma autónoma con menos de 24 horas de anticipación. Por favor, acuda al mesón presencial o comuníquese vía telefónica.' });
        }

        db.run(`UPDATE turnos SET estado = 'Libre', id_paciente = NULL WHERE id = ?`, [turnoId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error al cancelar el turno' });
            }
            res.json({ message: 'Turno cancelado exitosamente' });
        });
    });
});

// PUT /api/turnos/reprogramar/:id (RF-07)
router.put('/reprogramar/:id', verifyToken, (req, res) => {
    const turnoIdViejo = req.params.id;
    const { nuevoTurnoId } = req.body;
    const pacienteId = req.user.id;

    // Primero verificamos que el viejo se pueda cancelar
    db.get(`SELECT fecha_hora FROM turnos WHERE id = ? AND id_paciente = ? AND estado = 'Agendado'`, [turnoIdViejo, pacienteId], (err, turnoViejo) => {
        if (err || !turnoViejo) {
            return res.status(404).json({ error: 'Turno original no encontrado' });
        }

        const diffHoras = (new Date(turnoViejo.fecha_hora) - new Date()) / (1000 * 60 * 60);
        if (diffHoras < 24) {
            return res.status(400).json({ error: 'No puede reprogramar con menos de 24 horas de anticipación.' });
        }

        // Usamos db.serialize para que la cancelación y la reserva sean atómicas (o lo más cercano en SQLite sin BEGIN TRANSACTION)
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // Reservar el nuevo turno
            db.run(`UPDATE turnos SET estado = 'Agendado', id_paciente = ? WHERE id = ? AND estado = 'Libre'`, [pacienteId, nuevoTurnoId], function(err) {
                if (err || this.changes === 0) {
                    db.run('ROLLBACK');
                    return res.status(409).json({ error: 'El bloque nuevo ya no está disponible.' });
                }

                // Liberar el viejo turno
                db.run(`UPDATE turnos SET estado = 'Libre', id_paciente = NULL WHERE id = ?`, [turnoIdViejo], function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Error interno en la reprogramación.' });
                    }
                    
                    db.run('COMMIT');
                    res.json({ message: 'Reprogramación exitosa' });
                });
            });
        });
    });
});

module.exports = router;
