import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AgendarHora from './pages/AgendarHora';
import MisTurnos from './pages/MisTurnos';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;

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
            <PrivateRoute>
              <AgendarHora />
            </PrivateRoute>
          } />
          
          <Route path="/mis-turnos" element={
            <PrivateRoute>
              <MisTurnos />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
