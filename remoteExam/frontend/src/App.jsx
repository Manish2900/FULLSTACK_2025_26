import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Exam from './pages/Exam';
import Proctor from './pages/Proctor';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);

    if (userData.role === 'PROCTOR') {
      navigate('/proctor');
    } else {
      navigate('/exam');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="app-container">
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to={user.role === 'PROCTOR' ? '/proctor' : '/exam'} /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/exam" element={
          user && user.role === 'STUDENT' ? <Exam user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        <Route path="/proctor" element={
          user && user.role === 'PROCTOR' ? <Proctor user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        <Route path="*" element={<Navigate to={user ? (user.role === 'PROCTOR' ? '/proctor' : '/exam') : '/login'} />} />
      </Routes>
    </div>
  );
}

export default App;
