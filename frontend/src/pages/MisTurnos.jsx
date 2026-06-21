import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Calendar, User, Clock, AlertCircle } from 'lucide-react';

// Página para mostrar los turnos del paciente
const MisTurnos = () => {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('proximos'); // 'proximos' | 'historial'

  const fetchTurnos = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/turnos/mis-turnos', {
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
    fetchTurnos();
  }, []);

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Está seguro de que desea cancelar esta cita?')) return;
    
    try {
      const res = await fetch(`http://localhost:3001/api/turnos/cancelar/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('Cita cancelada exitosamente.');
      fetchTurnos();
    } catch (err) {
      alert(`Error al cancelar: ${err.message}`);
    }
  };

  const getStatusColor = (estado) => {
    switch(estado) {
      case 'Agendado': return { bg: '#dcfce7', text: 'var(--status-success)' };
      case 'Presente': return { bg: '#e0f2fe', text: 'var(--status-info)' };
      case 'En espera': return { bg: '#fef3c7', text: 'var(--status-warning)' };
      case 'Inasistencia': return { bg: '#fee2e2', text: 'var(--status-danger)' };
      default: return { bg: '#f1f5f9', text: 'var(--text-light)' };
    }
  };

  const now = new Date();
  
  // Filtrar turnos según pestaña
  const proximos = turnos.filter(t => new Date(t.fecha_hora) > now && t.estado === 'Agendado');
  const historial = turnos.filter(t => new Date(t.fecha_hora) <= now || t.estado !== 'Agendado');

  const turnosAMostrar = tab === 'proximos' ? proximos : historial;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Mis Turnos</h1>

        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
          <button 
            onClick={() => setTab('proximos')} 
            style={{ padding: '0.75rem 1rem', border: 'none', background: 'transparent', fontWeight: 600, color: tab === 'proximos' ? 'var(--primary-color)' : 'var(--text-light)', borderBottom: tab === 'proximos' ? '2px solid var(--primary-color)' : '2px solid transparent', cursor: 'pointer' }}
          >
            Próximos
          </button>
          <button 
            onClick={() => setTab('historial')} 
            style={{ padding: '0.75rem 1rem', border: 'none', background: 'transparent', fontWeight: 600, color: tab === 'historial' ? 'var(--primary-color)' : 'var(--text-light)', borderBottom: tab === 'historial' ? '2px solid var(--primary-color)' : '2px solid transparent', cursor: 'pointer' }}
          >
            Historial
          </button>
        </div>

        {error && <div style={{ color: 'red' }}>{error}</div>}

        {loading ? (
          <p>Cargando tus turnos...</p>
        ) : turnosAMostrar.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: 'var(--border-radius-lg)', border: '1px dashed #e2e8f0' }}>
            <p style={{ color: 'var(--text-light)' }}>
              {tab === 'proximos' ? 'No tienes turnos próximos agendados.' : 'No tienes un historial de turnos en el sistema.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
            {turnosAMostrar.map(turno => {
              const statusColors = getStatusColor(turno.estado);
              return (
                <div key={turno.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', margin: 0 }}>{turno.especialidad}</h3>
                    <span style={{ backgroundColor: statusColors.bg, color: statusColors.text, padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                      {turno.estado}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <Calendar size={16} /> {new Date(turno.fecha_hora).toLocaleDateString('es-CL')}
                    <Clock size={16} style={{ marginLeft: '0.5rem' }} /> {new Date(turno.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    <User size={16} /> {turno.profesional}
                  </div>
                  
                  {tab === 'proximos' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <button onClick={() => alert('Para reagendar, primero cancele su cita actual y busque un nuevo bloque.')} className="btn" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid #cbd5e1', color: 'var(--text-dark)' }}>
                        Reagendar
                      </button>
                      <button onClick={() => handleCancelar(turno.id)} className="btn" style={{ flex: 1, backgroundColor: '#fee2e2', color: 'var(--status-danger)' }}>
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MisTurnos;
