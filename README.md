# SGT-CESFAM (Sistema de Gestión de Turnos)

- **Integrantes:** Eduardo Marin, Francisco Quiroga, Ignacio Carrillo
- **Curso:** Ingeniería de Software - ICI4244

---

Bienvenido a SGT-CESFAM, una plataforma integral diseñada para optimizar y digitalizar el ciclo completo de atención en un Centro de Salud Familiar. Este proyecto fue desarrollado como entrega final de la asignatura de Ingeniería de Software.

## Características Principales

El sistema está dividido en cuatro módulos principales con control de acceso basado en roles (RBAC):

1. **Módulo Paciente:**
   - Auto-registro seguro con validación y formateo automático de RUT chileno.
   - Agendamiento de horas filtrado por especialidad.
   - Cancelación o reprogramación de horas sujeto a **reglas estrictas de 24 horas de anticipación**.

2. **Módulo de Admisión (Mesón):**
   - Agenda diaria centralizada para el control de flujo.
   - **Registro de Check-in** que emite notificaciones en tiempo real al box del médico.
   - Asignación manual de horas de emergencia (excluidas de la regla de 24 horas).

3. **Módulo Clínico (Profesional):**
   - Recepción mágica (mediante WebSockets) de las alertas de "pacientes en sala de espera".
   - Panel de flujo de trabajo ordenado por prioridad de asistencia.
   - Transición de estados médicos: "Atendido" o "Inasistencia".

4. **Módulo de Reportes (Jefatura):**
   - Dashboard interactivo utilizando gráficos (Recharts).
   - KPIs de tasas de inasistencias y volumen de demanda por especialidad médica.

---

## Stack Tecnológico

**Frontend:**
- [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- Vanilla CSS (Metodología BEM / Tokens CSS modernos)
- `lucide-react` para iconografía.
- `recharts` para despliegue de métricas directivas.
- `socket.io-client` para notificaciones en tiempo real.

**Backend:**
- [Node.js](https://nodejs.org/) con [Express](https://expressjs.com/)
- [SQLite3](https://www.sqlite.org/) como motor de base de datos relacional (ligero y transaccional).
- `bcrypt` para el hasheo de contraseñas.
- `jsonwebtoken` para control de sesiones (JWT).
- `socket.io` para habilitar salas privadas y eventos en vivo.

---

## Instrucciones de Instalación y Ejecución

Sigue estos pasos para clonar el proyecto e inicializar el servidor local.

### 1. Clonar el Repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd Proyecto-de-Ingenieria-de-Software_Gestion-de-turnos-en-CESFAM
```

### 2. Configuración del Backend
```bash
cd backend
npm install
```
Antes de ejecutar el servidor, debemos inicializar y sembrar la base de datos local de SQLite con datos ficticios para poder probar la plataforma:
```bash
node initDb.js
```
Finalmente, levanta el servidor backend (que correrá en el puerto `3001`):
```bash
npm run dev
# o usando node nativo: node server.js
```

### 3. Configuración del Frontend
Abre una nueva terminal, vuelve a la raíz del proyecto y navega hacia la carpeta del cliente:
```bash
cd frontend
npm install
```
Levanta la interfaz web (usualmente disponible en `http://localhost:5173`):
```bash
npm run dev
```

---

## Credenciales de Prueba (Semilla)

El script `initDb.js` genera perfiles pre-configurados para que el equipo evaluador pueda probar todo el flujo sin necesidad de crear nuevas cuentas.

| Rol | RUT | Contraseña | Propósito |
| :--- | :--- | :--- | :--- |
| **Paciente** | `12.345.678-9` | `123456` | Probar registro, reserva y reglas de cancelación de 24h. |
| **Administrativo** | `9.876.543-2` | `admin123` | Probar el panel de mesón, asignación manual y emitir Check-in. |
| **Profesional** | `11.111.111-1` | `prof123` | Dr. Soto. Probar la agenda clínica y recepción del pop-up de Check-in. |
| **Jefatura** | `99.999.999-9` | `jefe123` | Probar el módulo de métricas, PieCharts y BarCharts en vivo. |

---

## Reglas de Negocio Implementadas
* El sistema es estrictamente transaccional. SQLite bloquea reservas concurrentes a través de `UPDATE WHERE estado = 'Libre'`.
* La regla de anulación es inflexible en el lado del cliente (Backend retorna 403 Forbidden si faltan menos de 24 horas).
* El sistema usa WebSockets divididos por `rooms` para evitar que un traumatólogo reciba la notificación de un paciente de odontología.