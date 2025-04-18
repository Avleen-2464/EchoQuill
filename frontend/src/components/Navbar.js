import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css'

const Navbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <nav className={`navbar ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="navbar-brand">
        <Link to="/" className="navbar-item">
          <img src="logo.png" alt="EchoQuill Logo" className="logo" />
          <span>EchoQuill</span>
        </Link>
      </div>

      <div className="navbar-menu">
        {user && (
          <Link to="/journal" className="navbar-item">Journal</Link>
        )}
        
        <div className="navbar-item">
          <button onClick={toggleTheme} className="theme-toggle-btn">
            {isDarkMode ? '🌙' : '🌞'}
          </button>
        </div>

        <div className="navbar-end">
          {user ? (
            <>
              <Link to="/profile" className="navbar-item">Profile</Link>
              <button onClick={logout} className="navbar-item">Logout</button>
            </>
          ) : (
            <Link to="/login" className="navbar-item">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
