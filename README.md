# Sistema de Gestión de Turnos CESFAM (SGT-CESFAM)

Plataforma de software web responsive multi-rol orientada a digitalizar y centralizar el ciclo completo de gestión de turnos dentro de un Centro de Salud Familiar.

Este documento se centra especificamente en la arquitectura y el stack tecnológico del proyecto. Para revisar el detalle teórico de planificación y desarrollo, revise el documento adjunto `Proyecto de Asignatura_ Gestión de turnos en CESFAM.pdf` en la carpeta principal del repositorio.

## Arquitectura y Stack Tecnológico

El proyecto está diseñado para funcionar como un prototipo rápido, liviano y escalable.

- **Frontend**: SPA desarrollada en React.js, inicializada con Vite.
  - Diseño implementado puramente en **Vanilla CSS**, asegurando alta mantenibilidad sin depender de librerías externas.
  - Interfaz orientada a la experiencia de usuario (usabilidad) mediante Glassmorphism y micro-interacciones.
- **Backend**: API REST en Node.js utilizando el framework Express.
- **Base de Datos**: SQLite, permitiendo un desarrollo local simple sin necesidad de contenedores adicionales ni servidores externos, mientras retiene la integridad relacional para transacciones y control de concurrencia.

## Estructura del Proyecto

```
.
├── backend/            # API REST (Node.js/Express)
│   ├── cesfam.sqlite   # Archivo de base de datos local
│   ├── db.js           # Configuración de conexión SQLite
│   ├── initDb.js       # Script de inicialización y datos semilla
│   ├── package.json
│   └── (Futuros controladores y rutas)
├── frontend/           # Interfaz de Usuario (React + Vite)
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── index.css   # Sistema de diseño base (Vanilla CSS)
│   │   ├── App.jsx     # Componente raíz
│   │   └── (Futuros componentes, vistas y hooks)
└── README.md
```

## Ejecución Local

Para levantar este proyecto en un entorno de desarrollo local, sigue estos pasos:

### Backend
Navega a la carpeta `backend`:
```bash
cd backend
npm install
```
Inicializa la base de datos (solo la primera vez):
```bash
node initDb.js
```
*Nota: El script poblará la base de datos con algunos perfiles de usuario por defecto (Paciente, Administrativo, Profesional, Jefatura).*

### Frontend
En otra terminal, navega a la carpeta `frontend`:
```bash
cd frontend
npm install
npm run dev
```
Esto iniciará el servidor de desarrollo de Vite (normalmente en `http://localhost:5173`).

## Modelo de Datos

La base de datos relacional (SQLite) contiene las siguientes entidades principales:

- **Usuarios (`usuarios`)**: Centraliza los perfiles de los 4 actores del sistema mediante el campo `rol`. Almacena credenciales (RUT, contraseña, información de contacto).
- **Especialidades (`especialidades`)**: Define el catálogo de atenciones del CESFAM (ej. Medicina General, Odontología).
- **Turnos (`turnos`)**: Tabla transaccional central que cruza un `id_profesional`, `id_especialidad`, `fecha_hora` e `id_paciente`. Su estado puede transicionar entre 'Libre', 'Agendado', 'Presente', 'Atendido', 'Cancelado', etc.