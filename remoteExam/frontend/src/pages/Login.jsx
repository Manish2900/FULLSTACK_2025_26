import React, { useState } from 'react';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.role === 'STUDENT') {
          onLogin(data);
        } else {
          setError('Unknown role');
        }
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  return (
    <div className="login-container">
      <h2>Remote Exam Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            placeholder="Enter your email"
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            placeholder="Enter your password"
          />
        </div>
        <button type="submit" className="btn-primary">Login</button>
      </form>
    </div>
  );
}

export default Login;
