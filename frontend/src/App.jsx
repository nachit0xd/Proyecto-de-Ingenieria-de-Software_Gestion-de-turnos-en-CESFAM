import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AgendarHora from './pages/AgendarHora';
import MisTurnos from './pages/MisTurnos';
import PanelAdmision from './pages/PanelAdmision';
import './index.css';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    // Si no tiene el rol, llevarlo a su inicio por defecto
    return <Navigate to={user.rol === 'Paciente' ? "/agendar" : "/admision"} />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/dashboard" element={<Navigate to="/agendar" />} />
          
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
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
