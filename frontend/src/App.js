import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { JournalProvider } from './context/JournalContext';

// Importing Components
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';

// Importing Global Styles
import './styles/Global.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <JournalProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              {/* Redirect any unknown routes to landing page */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </JournalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
