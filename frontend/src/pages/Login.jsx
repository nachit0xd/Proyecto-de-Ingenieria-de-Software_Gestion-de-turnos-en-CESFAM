import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity } from 'lucide-react'; 
import { formatRut } from '../utils/formatters';

const Login = () => {
  const [rut, setRut] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut, contrasena }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '1rem', borderRadius: '50%', marginBottom: '1rem', display: 'inline-block' }}>
            <Activity size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>SGT-CESFAM</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>Inicia sesión para agendar tu hora</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: 'var(--status-danger)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <div className="input-group">
            <label className="input-label" htmlFor="rut">RUT</label>
            <input
              id="rut"
              type="text"
              className="input-field"
              placeholder="12.345.678-9"
              value={rut}
              onChange={(e) => setRut(formatRut(e.target.value))}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              type="password"
              className="input-field"
              placeholder="**********"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
            <a href="#" style={{ fontSize: '0.75rem', fontWeight: 500 }}>¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} disabled={loading}>
            {loading ? 'Iniciando...' : 'Iniciar sesión'}
          </button>

          <div style={{ position: 'relative', textAlign: 'center', margin: '1.5rem 0' }}>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />
          </div>

          <Link to="/register" style={{ display: 'block' }}>
            <button type="button" className="btn" style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid #cbd5e1', color: 'var(--text-dark)' }}>
              Crear cuenta nueva
            </button>
          </Link>
        </form>
      </div>
    </div>
  );
};

export default Login;
