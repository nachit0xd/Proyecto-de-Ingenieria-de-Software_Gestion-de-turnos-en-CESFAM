import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Calendar, User, Search, CheckCircle } from 'lucide-react';

// Página para agendar horas (solo para pacientes)
const AgendarHora = () => {
  const { user } = useContext(AuthContext);
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filtros
  const [especialidad, setEspecialidad] = useState('');
  const [profesional, setProfesional] = useState('');

  const [reservaSuccess, setReservaSuccess] = useState(false);

  const fetchDisponibles = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (especialidad) query.append('especialidad', especialidad);
      if (profesional) query.append('profesional', profesional);

      const res = await fetch(`http://localhost:3001/api/turnos/disponibles?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al buscar horas');
      
      setTurnos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisponibles();
  }, []);

  const handleReservar = async (turnoId) => {
    if (!window.confirm('¿Confirma la reserva de este bloque horario?')) return;

    try {
      const res = await fetch('http://localhost:3001/api/turnos/reservar', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ turnoId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReservaSuccess(true);
      fetchDisponibles(); // Recargar matriz

      setTimeout(() => setReservaSuccess(false), 4000);
    } catch (err) {
      alert(`No se pudo agendar: ${err.message}`);
      fetchDisponibles(); // Recargar por si hubo colisión de concurrencia
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Agendar Hora</h1>

        {reservaSuccess && (
          <div style={{ backgroundColor: '#dcfce7', color: 'var(--status-success)', padding: '1rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} /> Reserva confirmada exitosamente. Se ha enviado un comprobante.
          </div>
        )}

        <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
            <label className="input-label">Especialidad</label>
            <div style={{ position: 'relative' }}>
              <select className="input-field" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} style={{ appearance: 'none' }}>
                <option value="">Todas las especialidades</option>
                <option value="Medicina General">Medicina General</option>
                <option value="Odontología">Odontología</option>
                <option value="Psicología">Psicología</option>
              </select>
            </div>
          </div>
          
          <div className="input-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
            <label className="input-label">Profesional</label>
            <input type="text" className="input-field" placeholder="Buscar por nombre..." value={profesional} onChange={(e) => setProfesional(e.target.value)} />
          </div>

          <button onClick={fetchDisponibles} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Search size={18} /> Buscar
          </button>
        </div>

        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Horas disponibles</h2>
          
          {loading ? (
            <p>Cargando disponibilidad...</p>
          ) : turnos.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: 'var(--border-radius-lg)', border: '1px dashed #e2e8f0' }}>
              <p style={{ color: 'var(--text-light)' }}>No existen horas disponibles para los criterios de búsqueda en las próximas semanas.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {turnos.map(turno => (
                <div key={turno.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', margin: '0 0 0.25rem 0' }}>{turno.especialidad}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      <Calendar size={14} /> {new Date(turno.fecha_hora).toLocaleString('es-CL')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                      <User size={14} /> {turno.profesional}
                    </div>
                  </div>
                  
                  <button onClick={() => handleReservar(turno.id)} className="btn btn-primary" style={{ marginTop: 'auto' }}>
                    Reservar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgendarHora;
