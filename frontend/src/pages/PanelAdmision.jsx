import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Search, CheckCircle, UserPlus } from 'lucide-react';
import { formatRut } from '../utils/formatters';

// Página principal del módulo de admisión (mesón)
const PanelAdmision = () => {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [searchRut, setSearchRut] = useState('');
  
  // Para asignación manual, modal y campos
  const [modalAsignar, setModalAsignar] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [rutPacienteAsignar, setRutPacienteAsignar] = useState('');

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/admin/agenda-diaria', {
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
  }, []);

  const handleCheckIn = async (turnoId) => {
    if (!window.confirm('¿Confirmar que el paciente está presente en la sala de espera?')) return;
    
    try {
      const res = await fetch(`http://localhost:3001/api/admin/check-in/${turnoId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('Check-in realizado. Se ha notificado al médico en el box.');
      fetchAgenda();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAsignacionManual = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/admin/asignar', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ rut: rutPacienteAsignar, turnoId: turnoSeleccionado.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('Cita asignada correctamente por el mesón.');
      setModalAsignar(false);
      setRutPacienteAsignar('');
      fetchAgenda();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const turnosFiltrados = searchRut 
    ? turnos.filter(t => t.paciente_rut && t.paciente_rut.includes(searchRut))
    : turnos;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Panel de Admisión (Mesón)</h1>
          <div className="input-group" style={{ margin: 0, minWidth: '250px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', color: 'var(--text-light)' }} />
              <input 
                type="text" 
                placeholder="Buscar RUT paciente..." 
                className="input-field" 
                style={{ paddingLeft: '35px' }}
                value={searchRut}
                onChange={(e) => setSearchRut(formatRut(e.target.value))}
              />
            </div>
          </div>
        </div>

        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-light)' }}>Hora</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-light)' }}>Paciente (RUT)</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-light)' }}>Profesional</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-light)' }}>Estado</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-light)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Cargando agenda...</td></tr>
              ) : turnosFiltrados.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>No hay turnos para hoy.</td></tr>
              ) : (
                turnosFiltrados.map((turno) => (
                  <tr key={turno.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{new Date(turno.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ padding: '1rem' }}>
                      {turno.paciente_nombre ? (
                        <>
                          <div style={{ fontWeight: 500 }}>{turno.paciente_nombre}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{turno.paciente_rut}</div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Disponible</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>{turno.profesional}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{turno.especialidad}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '1rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        backgroundColor: turno.estado === 'Presente' ? '#e0f2fe' : turno.estado === 'Agendado' ? '#fef3c7' : turno.estado === 'Libre' ? '#dcfce7' : '#f1f5f9',
                        color: turno.estado === 'Presente' ? 'var(--status-info)' : turno.estado === 'Agendado' ? 'var(--status-warning)' : turno.estado === 'Libre' ? 'var(--status-success)' : 'var(--text-dark)'
                      }}>
                        {turno.estado}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {turno.estado === 'Agendado' && (
                        <button onClick={() => handleCheckIn(turno.id)} className="btn btn-primary" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <CheckCircle size={16} /> Check-in
                        </button>
                      )}
                      {turno.estado === 'Libre' && (
                        <button 
                          onClick={() => { setTurnoSeleccionado(turno); setModalAsignar(true); }} 
                          className="btn" 
                          style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', border: '1px solid #cbd5e1' }}
                        >
                          <UserPlus size={16} /> Asignar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {modalAsignar && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div className="card" style={{ width: '400px' }}>
              <h2 style={{ marginTop: 0 }}>Asignación Manual (Mesón)</h2>
              <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
                Asignando bloque de las {new Date(turnoSeleccionado.fecha_hora).toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})} con {turnoSeleccionado.profesional}.
              </p>
              <form onSubmit={handleAsignacionManual}>
                <div className="input-group">
                  <label className="input-label">RUT del Paciente</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="12.345.678-9"
                    value={rutPacienteAsignar}
                    onChange={(e) => setRutPacienteAsignar(formatRut(e.target.value))}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" onClick={() => setModalAsignar(false)} className="btn" style={{ flex: 1 }}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirmar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelAdmision;
