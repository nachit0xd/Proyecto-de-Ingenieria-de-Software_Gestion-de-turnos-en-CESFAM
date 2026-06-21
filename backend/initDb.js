const db = require('./db');
const bcrypt = require('bcrypt');

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
    db.exec(initSQL, async (err) => {
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
        
        // Función auxiliar para hashear contraseñas e insertarlas
        const insertUsuario = db.prepare('INSERT OR IGNORE INTO usuarios (rut, nombre, contrasena, rol, email, telefono) VALUES (?, ?, ?, ?, ?, ?)');
        
        const seedUsers = [
            ['12345678-9', 'Paciente Prueba', '123456', 'Paciente', 'paciente@test.cl', '+56911111111'],
            ['9876543-2', 'Admin Prueba', 'admin123', 'Administrativo', 'admin@cesfam.cl', '+56922222222'],
            ['11111111-1', 'Dr. Profesional Soto', 'prof123', 'Profesional', 'soto@cesfam.cl', '+56933333333'],
            ['22222222-2', 'Dra. Profesional Vega', 'prof123', 'Profesional', 'vega@cesfam.cl', '+56944444444'],
            ['99999999-9', 'Jefe Director', 'jefe123', 'Jefatura', 'jefe@cesfam.cl', '+56955555555']
        ];

        for (const user of seedUsers) {
            const [rut, nombre, passPlana, rol, email, telefono] = user;
            const hash = await bcrypt.hash(passPlana, 10);
            insertUsuario.run(rut, nombre, hash, rol, email, telefono);
        }
        
        insertUsuario.finalize(() => {
            console.log('Datos semilla (usuarios con hash) insertados.');
            
            // Insertar turnos semilla
            db.get("SELECT id FROM usuarios WHERE rol = 'Profesional' LIMIT 1", (err, prof) => {
                if (prof) {
                    const stmtTurnos = db.prepare("INSERT OR IGNORE INTO turnos (id_profesional, id_especialidad, fecha_hora, estado) VALUES (?, ?, ?, 'Libre')");
                    const now = new Date();
                    
                    // Turnos para mañana
                    const t1 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    t1.setHours(9, 0, 0, 0);
                    stmtTurnos.run(prof.id, 1, t1.toISOString()); // Medicina General
                    
                    const t2 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    t2.setHours(10, 0, 0, 0);
                    stmtTurnos.run(prof.id, 2, t2.toISOString()); // Odontología

                    // Turnos para la proxima semana
                    const t3 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    t3.setHours(11, 30, 0, 0);
                    stmtTurnos.run(prof.id, 1, t3.toISOString()); // Medicina General
                    
                    const t4 = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
                    t4.setHours(14, 0, 0, 0);
                    stmtTurnos.run(prof.id, 3, t4.toISOString()); // Psicología

                    stmtTurnos.finalize(() => {
                        console.log('Turnos semilla insertados.');
                        db.close();
                    });
                } else {
                    db.close();
                }
            });
        });
    });
});
