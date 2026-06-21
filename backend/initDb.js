const db = require('./db');

const initSQL = `
-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rut TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  contrasena TEXT NOT NULL,
  rol TEXT NOT NULL, -- 'Paciente', 'Administrativo', 'Profesional', 'Jefatura'
  email TEXT,
  telefono TEXT,
  activo INTEGER DEFAULT 1
);

-- Tabla de Especialidades
CREATE TABLE IF NOT EXISTS especialidades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
);

-- Tabla de Bloques Horarios (Turnos)
CREATE TABLE IF NOT EXISTS turnos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_profesional INTEGER NOT NULL,
  id_especialidad INTEGER NOT NULL,
  fecha_hora DATETIME NOT NULL,
  estado TEXT DEFAULT 'Libre', -- 'Libre', 'Agendado', 'Presente', 'Atendido', 'Cancelado', 'Inasistencia', 'Inhabilitado'
  id_paciente INTEGER,
  FOREIGN KEY (id_profesional) REFERENCES usuarios(id),
  FOREIGN KEY (id_especialidad) REFERENCES especialidades(id),
  FOREIGN KEY (id_paciente) REFERENCES usuarios(id)
);
`;

db.serialize(() => {
    db.exec(initSQL, (err) => {
        if (err) {
            console.error('Error al inicializar las tablas:', err.message);
            return;
        }
        console.log('Tablas inicializadas correctamente.');

        // Insertar datos semilla (Especialidades)
        const especialidades = ['Medicina General', 'Odontología', 'Psicología', 'Kinesiología'];
        const insertEspecialidad = db.prepare('INSERT OR IGNORE INTO especialidades (nombre) VALUES (?)');
        especialidades.forEach(esp => {
            insertEspecialidad.run(esp);
        });
        insertEspecialidad.finalize();
        
        // Insertar datos semilla (Usuarios de prueba)
        // NOTA: Las contraseñas aquí están en texto plano por simplicidad del script de semilla,
        // pero en producción (Sprint 1) se utilizará bcrypt como indica el plan.
        const insertUsuario = db.prepare('INSERT OR IGNORE INTO usuarios (rut, nombre, contrasena, rol, email, telefono) VALUES (?, ?, ?, ?, ?, ?)');
        
        insertUsuario.run('12345678-9', 'Paciente Prueba', '123456', 'Paciente', 'paciente@test.cl', '+56911111111');
        insertUsuario.run('9876543-2', 'Admin Prueba', 'admin123', 'Administrativo', 'admin@cesfam.cl', '+56922222222');
        insertUsuario.run('11111111-1', 'Dr. Profesional Soto', 'prof123', 'Profesional', 'soto@cesfam.cl', '+56933333333');
        insertUsuario.run('22222222-2', 'Dra. Profesional Vega', 'prof123', 'Profesional', 'vega@cesfam.cl', '+56944444444');
        insertUsuario.run('99999999-9', 'Jefe Director', 'jefe123', 'Jefatura', 'jefe@cesfam.cl', '+56955555555');
        
        insertUsuario.finalize(() => {
            console.log('Datos semilla insertados.');
            db.close();
        });
    });
});
