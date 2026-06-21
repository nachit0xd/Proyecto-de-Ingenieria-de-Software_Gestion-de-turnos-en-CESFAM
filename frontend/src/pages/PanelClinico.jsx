import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Calendar, User, CheckCircle, XCircle, Bell } from 'lucide-react';
import { io } from 'socket.io-client';

// Página del Panel Clínico para Profesionales de la Salud
const PanelClinico = () => {
  const { user } = useContext(AuthContext);
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notificacion, setNotificacion] = useState(null);

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/clinico/agenda', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTurnos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgenda();

    // Configurar Socket.io
    const socket = io('http://localhost:3001');

    if (user?.id) {
      socket.emit('join_profesional_room', user.id);
    }

    socket.on('nuevo_check_in', (data) => {
      // Mostrar toast/alerta
      setNotificacion(data.mensaje);
      
      // Recargar la agenda para ver el estado "Presente"
      fetchAgenda();

      // Ocultar la notificación después de 5 segundos
      setTimeout(() => {
        setNotificacion(null);
      }, 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleTransicion = async (id, accion) => {
    let confirmMsg = accion === 'atender' 
      ? '¿Confirmar inicio y fin de la atención?' 
      : '¿Confirmar inasistencia del paciente?';

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`http://localhost:3001/api/clinico/${accion}/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      fetchAgenda(); // Refrescar lista, el paciente ya no saldrá porque el query excluye Atendidos, pero en este caso el query trae todos los que no son Libres. 
      // Si queremos que salgan de la lista, el backend o frontend deberían filtrarlos. Actualmente el backend los trae todos, se filtraran visualmente.
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Separar para UX
  const turnosPendientes = turnos.filter(t => t.estado === 'Presente' || t.estado === 'Agendado');
  const turnosFinalizados = turnos.filter(t => t.estado === 'Atendido' || t.estado === 'Inasistencia');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Panel Clínico: Agenda del Día</h1>

        {notificacion && (
          <div style={{
            position: 'absolute',
            top: '2rem',
            right: '2rem',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            padding: '1rem',
            borderRadius: 'var(--border-radius-md)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            zIndex: 100,
            animation: 'slideIn 0.3s ease-out'
          }}>
            <Bell size={20} />
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>¡Nuevo Check-in!</p>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>{notificacion}</p>
            </div>
          </div>
        )}

        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
          
          {/* SECCIÓN PACIENTES EN ESPERA */}
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-dark)', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>Pacientes en Espera / Por Atender</h2>
            {loading ? (
              <p>Cargando pacientes...</p>
            ) : turnosPendientes.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 'var(--border-radius-lg)', border: '1px dashed #cbd5e1' }}>
                <p style={{ color: 'var(--text-light)', margin: 0 }}>No hay pacientes pendientes para hoy.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {turnosPendientes.map(turno => (
                  <div key={turno.id} className="card" style={{ borderLeft: turno.estado === 'Presente' ? '4px solid var(--status-info)' : '4px solid var(--status-warning)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', margin: '0 0 0.25rem 0' }}>{new Date(turno.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</h3>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                          {turno.paciente_nombre} ({turno.paciente_rut})
                        </div>
                      </div>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600,
                        backgroundColor: turno.estado === 'Presente' ? '#e0f2fe' : '#fef3c7',
                        color: turno.estado === 'Presente' ? 'var(--status-info)' : 'var(--status-warning)'
                      }}>
                        {turno.estado}
                      </span>
                    </div>

                    {turno.estado === 'Presente' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <button onClick={() => handleTransicion(turno.id, 'atender')} className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle size={16} /> Atendido
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <button onClick={() => handleTransicion(turno.id, 'ausente')} className="btn" style={{ flex: 1, backgroundColor: '#fee2e2', color: 'var(--status-danger)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                          <XCircle size={16} /> Inasistencia
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECCIÓN PACIENTES ATENDIDOS */}
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-light)', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>Atenciones Finalizadas</h2>
            {turnosFinalizados.length === 0 ? (
               <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>No hay atenciones finalizadas aún.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', opacity: 0.8 }}>
                <tbody>
                  {turnosFinalizados.map(turno => (
                    <tr key={turno.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 500 }}>{new Date(turno.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ padding: '0.75rem' }}>{turno.paciente_nombre}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600,
                          backgroundColor: turno.estado === 'Atendido' ? '#dcfce7' : '#fee2e2',
                          color: turno.estado === 'Atendido' ? 'var(--status-success)' : 'var(--status-danger)'
                        }}>
                          {turno.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PanelClinico;
