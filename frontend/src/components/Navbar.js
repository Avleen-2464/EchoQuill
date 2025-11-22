import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useJournal } from '../context/JournalContext';
import '../styles/Navbar.css'

const Navbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { toggleJournal } = useJournal();
  const navigate = useNavigate();

  return (
    <nav className={`navbar ${isDarkMode ? 'dark' : 'light'}`} style={{
      backgroundColor: isDarkMode ? 'var(--bg-secondary)' : 'var(--navbar-bg)',
    }}>
      <div className="navbar-brand">
        <button onClick={() => navigate('/dashboard')} className="navbar-item btn btn-link">🏠 Home</button>
      </div>

      <div className="navbar-menu">
        {user && (
          <>
            <button onClick={() => navigate('/journal')} className="navbar-item btn btn-link">
              Journal
            </button>
            <button onClick={() => navigate('/remedies')} className="navbar-item btn btn-link">
              Remedies
            </button>
          </>
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
