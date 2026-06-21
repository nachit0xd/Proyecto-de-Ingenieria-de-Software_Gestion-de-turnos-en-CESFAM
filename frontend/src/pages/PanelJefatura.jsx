import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Users, Activity, AlertTriangle } from 'lucide-react';

// Panel de Reportería para Jefatura
const PanelJefatura = () => {
  const [inasistenciasData, setInasistenciasData] = useState([]);
  const [demandaData, setDemandaData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEstadisticas = async () => {
    setLoading(true);
    try {
      const [resInasistencias, resDemanda] = await Promise.all([
        fetch('http://localhost:3001/api/jefatura/estadisticas/inasistencias', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('http://localhost:3001/api/jefatura/estadisticas/demanda', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);

      if (!resInasistencias.ok || !resDemanda.ok) throw new Error('Error al cargar datos estadísticos');
      
      const inasistencias = await resInasistencias.json();
      const demanda = await resDemanda.json();

      // Mapear datos para Recharts
      setInasistenciasData(inasistencias.map(i => ({ name: i.estado, value: i.cantidad })));
      setDemandaData(demanda);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  const COLORS = ['#10b981', '#ef4444']; // Verde Atendido, Rojo Inasistencia

  const totalAtendidos = inasistenciasData.find(d => d.name === 'Atendido')?.value || 0;
  const totalInasistencias = inasistenciasData.find(d => d.name === 'Inasistencia')?.value || 0;
  const totalHistorico = totalAtendidos + totalInasistencias;

  const tasaInasistencia = totalHistorico === 0 ? 0 : Math.round((totalInasistencias / totalHistorico) * 100);
  const maxEspecialidad = demandaData.length > 0 ? demandaData[0] : null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Panel de Reportería (Jefatura)</h1>
          <button className="btn" onClick={fetchEstadisticas} disabled={loading}>
            {loading ? 'Actualizando...' : 'Refrescar Datos'}
          </button>
        </div>

        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary-color)' }}>
            <div style={{ backgroundColor: '#e0e7ff', padding: '1rem', borderRadius: '50%', color: 'var(--primary-color)' }}>
              <Users size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.875rem' }}>Total Histórico de Cierres</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 600 }}>{totalHistorico}</p>
            </div>
          </div>
          
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--status-danger)' }}>
            <div style={{ backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '50%', color: 'var(--status-danger)' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.875rem' }}>Tasa de Inasistencia</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 600 }}>{tasaInasistencia}%</p>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--status-info)' }}>
            <div style={{ backgroundColor: '#e0f2fe', padding: '1rem', borderRadius: '50%', color: 'var(--status-info)' }}>
              <Activity size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.875rem' }}>Especialidad más demandada</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.2rem', fontWeight: 600 }}>
                {maxEspecialidad ? maxEspecialidad.especialidad : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
          
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Efectividad de Asistencia</h2>
            {totalHistorico === 0 ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', marginTop: '2rem' }}>No hay datos suficientes.</p>
            ) : (
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inasistenciasData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {inasistenciasData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} turnos`, 'Cantidad']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Demanda por Especialidad</h2>
            {demandaData.length === 0 ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', marginTop: '2rem' }}>No hay datos suficientes.</p>
            ) : (
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demandaData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="especialidad" tick={{ fill: 'var(--text-light)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-light)' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="cantidad" fill="var(--primary-color)" radius={[4, 4, 0, 0]} name="Turnos Agendados/Realizados" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default PanelJefatura;
