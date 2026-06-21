const express = require('express');
const db = require('../db');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(verifyToken);
router.use(checkRole(['Jefatura']));

// GET /api/jefatura/estadisticas/inasistencias:
// Retorna la proporción de estados terminales (Atendido vs Inasistencia)
router.get('/estadisticas/inasistencias', (req, res) => {
    const query = `
        SELECT estado, COUNT(*) as cantidad
        FROM turnos
        WHERE estado IN ('Atendido', 'Inasistencia')
        GROUP BY estado
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al calcular estadísticas de inasistencias.' });
        }
        res.json(rows);
    });
});

// GET /api/jefatura/estadisticas/demanda:
// Retorna la cantidad de turnos agrupados por especialidad
router.get('/estadisticas/demanda', (req, res) => {
    const query = `
        SELECT e.nombre as especialidad, COUNT(t.id) as cantidad
        FROM especialidades e
        LEFT JOIN turnos t ON e.id = t.id_especialidad AND t.estado != 'Libre'
        GROUP BY e.id
        ORDER BY cantidad DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al calcular demanda por especialidad.' });
        }
        res.json(rows);
    });
});

module.exports = router;
