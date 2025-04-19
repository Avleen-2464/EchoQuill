import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  const navigate = useNavigate();
  const { login } = useAuth();

  const { email, password } = formData;

  // Check if server is running
  useEffect(() => {
    const checkServer = async () => {
      try {
        await axios.get('http://localhost:5000/api/auth/test');
        setServerStatus('running');
      } catch (err) {
        setServerStatus('not-running');
        setError('Cannot connect to server. Please make sure the backend server is running.');
      }
    };
    checkServer();
  }, []);

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { email });
      
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      
      console.log('Login response:', res.data);
      
      // Use the login function from AuthContext
      await login(res.data);
      localStorage.setItem('token', res.data.token);
      
      // Navigate to dashboard instead of home page
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error full details:', err);
      
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Unable to connect to server. Please try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="welcome-text">Welcome Back</div>
        
        {serverStatus === 'not-running' && (
          <div className="auth-error">
            <p>Server Connection Error</p>
            <p className="error-help">
              Please make sure the backend server is running at http://localhost:5000
            </p>
          </div>
        )}
        
        {error && (
          <div className="auth-error">
            <p>{error}</p>
            {error.includes('No account found') && (
              <p className="error-help">
                Please check your email address or <a href="/register">create a new account</a>
              </p>
            )}
          </div>
        )}
        
        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              required
              placeholder="Enter your email"
              autoComplete="email"
              disabled={serverStatus === 'not-running'}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={serverStatus === 'not-running'}
            />
          </div>
          
          <button 
            type="submit" 
            className={`auth-button ${loading ? 'loading' : ''}`}
            disabled={loading || serverStatus === 'not-running'}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <span onClick={() => navigate('/register')} className="auth-link">
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 