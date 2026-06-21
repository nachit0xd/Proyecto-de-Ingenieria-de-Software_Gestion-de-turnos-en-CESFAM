const express = require('express');
const db = require('../db');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const router = express.Router();

// Protegemos todas las rutas para que solo ingresen Profesionales
router.use(verifyToken);
router.use(checkRole(['Profesional']));

// GET /api/clinico/agenda (RF-12):
// Obtiene los turnos para HOY asignados estrictamente a este profesional
router.get('/agenda', (req, res) => {
    const idProfesional = req.user.id;

    const query = `
        SELECT 
            t.id, t.fecha_hora, t.estado, 
            e.nombre AS especialidad,
            pac.nombre AS paciente_nombre, pac.rut AS paciente_rut
        FROM turnos t
        JOIN especialidades e ON t.id_especialidad = e.id
        LEFT JOIN usuarios pac ON t.id_paciente = pac.id
        WHERE t.id_profesional = ?
          AND date(t.fecha_hora) = date('now', 'localtime')
          AND t.estado != 'Libre'
        ORDER BY 
            -- Priorizamos a los que están "Presente"
            CASE WHEN t.estado = 'Presente' THEN 1 ELSE 2 END ASC,
            t.fecha_hora ASC
    `;

    db.all(query, [idProfesional], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al buscar la agenda clínica.' });
        }
        res.json(rows);
    });
});

// PUT /api/clinico/atender/:id (RF-13):
// Transición al estado 'Atendido'
router.put('/atender/:id', (req, res) => {
    const turnoId = req.params.id;
    const idProfesional = req.user.id;

    // Solo podemos atender a alguien que estaba Presente o Agendado
    db.run(`UPDATE turnos SET estado = 'Atendido' WHERE id = ? AND id_profesional = ? AND estado IN ('Agendado', 'Presente')`, 
    [turnoId, idProfesional], 
    function(err) {
        if (err) return res.status(500).json({ error: 'Error al actualizar el turno.' });
        if (this.changes === 0) return res.status(400).json({ error: 'Turno inválido o no corresponde a este profesional.' });

        res.json({ message: 'Atención médica finalizada.' });
    });
});

// PUT /api/clinico/ausente/:id (RF-13):
// Transición al estado 'Inasistencia'
router.put('/ausente/:id', (req, res) => {
    const turnoId = req.params.id;
    const idProfesional = req.user.id;

    db.run(`UPDATE turnos SET estado = 'Inasistencia' WHERE id = ? AND id_profesional = ? AND estado IN ('Agendado', 'Presente')`, 
    [turnoId, idProfesional], 
    function(err) {
        if (err) return res.status(500).json({ error: 'Error al actualizar el turno.' });
        if (this.changes === 0) return res.status(400).json({ error: 'Turno inválido o no corresponde a este profesional.' });

        res.json({ message: 'Se ha registrado la inasistencia del paciente.' });
    });
});

module.exports = router;
