const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'cesfam_super_secret_key_2026';

// Registro de usuario (RF-01): Permitir a los pacientes registrarse en el sistema proporcionando su RUT, nombre, fecha de nacimiento, dirección, teléfono, correo electrónico y contraseña. 
// El sistema debe validar que el RUT no esté registrado previamente y que la contraseña cumpla con los requisitos de seguridad (mínimo 6 caracteres). 
// El rol por defecto para los usuarios registrados es "Paciente". En caso de éxito, devolver un mensaje de confirmación y el ID del nuevo usuario.
router.post('/register', async (req, res) => {
    const { rut, nombre, fechaNacimiento, direccion, telefono, correo, contrasena } = req.body;

    if (!rut || !nombre || !contrasena) {
        return res.status(400).json({ error: 'RUT, nombre y contraseña son requeridos' });
    }

    try {
        const hash = await bcrypt.hash(contrasena, 10);
        const rol = 'Paciente'; // Por defecto el autoregistro es para pacientes
        
        const stmt = db.prepare('INSERT INTO usuarios (rut, nombre, contrasena, rol, email, telefono) VALUES (?, ?, ?, ?, ?, ?)');
        
        stmt.run(rut, nombre, hash, rol, correo, telefono, function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'El RUT ya se encuentra registrado. Si olvidó su contraseña, utilice un módulo de recuperación.' });
                }
                return res.status(500).json({ error: 'Error al registrar usuario.' });
            }
            res.status(201).json({ message: 'Usuario registrado exitosamente', id: this.lastID });
        });
        stmt.finalize();
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// Inicio de sesión (RF-02): Permitir a los usuarios iniciar sesión proporcionando su RUT y contraseña. 
// El sistema debe validar las credenciales y, en caso de éxito, generar un token JWT que incluya el ID del usuario, su rol y nombre. 
// El token debe tener una expiración de 8 horas. En caso de error, devolver un mensaje indicando que las credenciales son inválidas.
router.post('/login', (req, res) => {
    const { rut, contrasena } = req.body;

    if (!rut || !contrasena) {
        return res.status(400).json({ error: 'RUT y contraseña son requeridos' });
    }

    db.get('SELECT * FROM usuarios WHERE rut = ? AND activo = 1', [rut], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas. Por favor, intente nuevamente.' });
        }

        const match = await bcrypt.compare(contrasena, user.contrasena);
        if (!match) {
            return res.status(401).json({ error: 'Credenciales inválidas. Por favor, intente nuevamente.' });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, rut: user.rut, rol: user.rol, nombre: user.nombre },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            user: { id: user.id, rut: user.rut, nombre: user.nombre, rol: user.rol }
        });
    });
});

module.exports = router;
