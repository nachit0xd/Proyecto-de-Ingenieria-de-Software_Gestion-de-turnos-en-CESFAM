import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

// Panel dinámico simple para mostrar que el login funciona (en futuros Sprints se implementarán paneles específicos por rol)
const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="card">
        <h2>Bienvenido al SGT-CESFAM</h2>
        <p>Has iniciado sesión exitosamente.</p>
        <div style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#e2e8f0', borderRadius: '8px' }}>
          <p><strong>Nombre:</strong> {user.nombre}</p>
          <p><strong>RUT:</strong> {user.rut}</p>
          <p><strong>Rol:</strong> {user.rol}</p>
        </div>
        <button onClick={logout} className="btn btn-primary">Cerrar Sesión</button>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          {/* Aquí irían las rutas específicas por rol en los siguientes Sprints */}
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
