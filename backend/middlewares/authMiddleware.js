const jwt = require('jsonwebtoken');

// Clave secreta para JWT (en producción, usar una variable de entorno segura)
const JWT_SECRET = process.env.JWT_SECRET || 'cesfam_super_secret_key_2026';

// Middleware para verificar el token JWT y extraer la información del usuario
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    
    if (!token) {
        return res.status(403).json({ error: 'No se proporcionó un token de autenticación.' });
    }

    const bearerToken = token.split(' ')[1] || token;

    jwt.verify(bearerToken, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido o expirado.' });
        }
        req.user = decoded;
        next();
    });
};

// Middleware para verificar el rol del usuario
const checkRole = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({ error: 'No tiene permisos suficientes para realizar esta acción.' });
        }
        next();
    };
};

module.exports = { verifyToken, checkRole };
