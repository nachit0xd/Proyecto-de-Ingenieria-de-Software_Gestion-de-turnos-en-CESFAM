import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AgendarHora from './pages/AgendarHora';
import MisTurnos from './pages/MisTurnos';
import PanelAdmision from './pages/PanelAdmision';
import PanelClinico from './pages/PanelClinico';
import './index.css';

// Componente para proteger rutas según autenticación y rol
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    // Si no tiene el rol, llevarlo a su inicio por defecto
    let defaultPath = "/";
    if (user.rol === 'Paciente') defaultPath = "/agendar";
    else if (user.rol === 'Administrativo' || user.rol === 'Jefatura') defaultPath = "/admision";
    else if (user.rol === 'Profesional') defaultPath = "/clinico";
    
    return <Navigate to={defaultPath} />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/dashboard" element={
            <PrivateRoute>
              {/* Dummy component for redirection inside PrivateRoute logic */}
              <Navigate to="/agendar" /> 
            </PrivateRoute>
          } />
          
          <Route path="/agendar" element={
            <PrivateRoute allowedRoles={['Paciente']}>
              <AgendarHora />
            </PrivateRoute>
          } />
          
          <Route path="/mis-turnos" element={
            <PrivateRoute allowedRoles={['Paciente']}>
              <MisTurnos />
            </PrivateRoute>
          } />

          <Route path="/admision" element={
            <PrivateRoute allowedRoles={['Administrativo', 'Jefatura']}>
              <PanelAdmision />
            </PrivateRoute>
          } />

          <Route path="/clinico" element={
            <PrivateRoute allowedRoles={['Profesional']}>
              <PanelClinico />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
