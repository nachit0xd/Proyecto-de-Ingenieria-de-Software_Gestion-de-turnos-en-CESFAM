import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { formatRut, formatDate } from '../utils/formatters';

const Register = () => {
  const [formData, setFormData] = useState({
    rut: '',
    nombre: '',
    apellidos: '',
    fechaNacimiento: '',
    direccion: '',
    telefono: '',
    correo: '',
    contrasena: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    let newValue = value;
    
    if (id === 'rut') {
      newValue = formatRut(value);
    } else if (id === 'fechaNacimiento') {
      newValue = formatDate(value);
    }
    
    setFormData(prev => ({ ...prev, [id]: newValue }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const nombreCompleto = `${formData.nombre} ${formData.apellidos}`;
      
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rut: formData.rut,
          nombre: nombreCompleto,
          fechaNacimiento: formData.fechaNacimiento,
          direccion: formData.direccion,
          telefono: formData.telefono,
          correo: formData.correo,
          contrasena: formData.contrasena
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar la cuenta');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
        <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <div style={{ backgroundColor: '#dcfce7', color: 'var(--status-success)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem', display: 'inline-block' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 style={{ marginBottom: '1rem' }}>¡Registro Exitoso!</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>Tu cuenta ha sido creada. Recibirás un correo electrónico con el enlace de verificación para habilitar tu perfil.</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--primary-color)' }}>Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem', margin: '2rem 0' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
        
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Ingresa tus datos de registro</h1>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: 'var(--status-danger)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ textAlign: 'left' }}>
          <div className="input-group">
            <label className="input-label" htmlFor="rut">RUT</label>
            <input id="rut" type="text" className="input-field" placeholder="12.345.678-9" value={formData.rut} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="nombre">Nombres</label>
            <input id="nombre" type="text" className="input-field" placeholder="Ignacio Javier" value={formData.nombre} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="apellidos">Apellidos</label>
            <input id="apellidos" type="text" className="input-field" placeholder="Carrillo Ramírez" value={formData.apellidos} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="fechaNacimiento">Fecha de nacimiento (dd/mm/aa)</label>
            <input id="fechaNacimiento" type="text" className="input-field" placeholder="01/01/01" value={formData.fechaNacimiento} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="direccion">Dirección</label>
            <input id="direccion" type="text" className="input-field" placeholder="Av. Valparaíso 0000, Viña del Mar" value={formData.direccion} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="telefono">Teléfono</label>
            <input id="telefono" type="text" className="input-field" placeholder="+56 9 1234 5678" value={formData.telefono} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="correo">Correo electrónico</label>
            <input id="correo" type="email" className="input-field" placeholder="prueba@mail.cl" value={formData.correo} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="contrasena">Contraseña</label>
            <input id="contrasena" type="password" className="input-field" placeholder="**********" value={formData.contrasena} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Procesando...' : 'Crear cuenta'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/login" style={{ fontSize: '0.875rem' }}>Volver al inicio de sesión</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
