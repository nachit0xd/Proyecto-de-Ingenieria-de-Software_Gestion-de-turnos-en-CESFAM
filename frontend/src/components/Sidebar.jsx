import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Clock, Activity, LogOut } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Componente de barra lateral (Sidebar)
const Sidebar = () => {
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);

  const navItems = [];

  // Agregar enlaces de navegación según el rol del usuario
  if (user?.rol === 'Paciente') {
    navItems.push(
      { name: 'Agendar Hora', path: '/agendar', icon: Calendar },
      { name: 'Mis Turnos', path: '/mis-turnos', icon: Clock }
    );
  }

  if (user?.rol === 'Administrativo' || user?.rol === 'Jefatura') {
    navItems.push(
      { name: 'Panel Admisión', path: '/admision', icon: Calendar }
    );
  }

  if (user?.rol === 'Profesional') {
    navItems.push(
      { name: 'Agenda Clínica', path: '/clinico', icon: Calendar }
    );
  }

  return (
    <div style={{ width: '250px', backgroundColor: 'var(--white)', borderRight: '1px solid #e2e8f0', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '0.5rem', borderRadius: '50%' }}>
          <Activity size={24} />
        </div>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>SGT-CESFAM</h2>
      </div>

      <nav style={{ flex: 1, padding: '1.5rem 1rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
          Módulo Paciente
        </p>
        <ul style={{ listStyle: 'none' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path} style={{ marginBottom: '0.5rem' }}>
                <Link 
                  to={item.path} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    padding: '0.75rem 1rem', 
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: isActive ? '#e0f2fe' : 'transparent',
                    color: isActive ? 'var(--primary-hover)' : 'var(--text-dark)',
                    fontWeight: isActive ? 600 : 500
                  }}
                >
                  <Icon size={20} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>{user?.nombre}</p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-light)' }}>{user?.rut}</p>
        </div>
        <button onClick={logout} className="btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--status-danger)', backgroundColor: '#fee2e2' }}>
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
