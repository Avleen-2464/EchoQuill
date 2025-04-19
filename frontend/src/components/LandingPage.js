import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="nav-left">
          <Link to="/" className="nav-logo">
            EchoQuill
          </Link>
          <div className="nav-links">
            <Link to="#how-it-works">How it Works</Link>
            <Link to="#features">Features</Link>
            <Link to="#contact">Contact</Link>
          </div>
        </div>
        <div className="nav-right">
          <Link to="/login" className="nav-signin">Sign In</Link>
          <Link to="/register" className="nav-signup">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Your intelligent, AI-powered journaling companion.</h1>
          <p>Effortless. Private. Personalized. Let your thoughts flow. We'll handle the rest.</p>
          <Link to="/register" className="cta-button">
            Start Journaling for Free →
          </Link>
        </div>
        <div className="hero-image">
          <div className="image-container">
            <img 
              src="/assets/hero-journal.jpeg" 
              alt="Person journaling with EchoQuill"
              className="hero-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentElement.classList.add('image-fallback');
              }}
            />
            <div className="image-overlay"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <h2>Why Choose EchoQuill?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">✨</div>
            <h3>Smart AI Suggestions</h3>
            <p>Get personalized prompts and insights tailored to your journaling style.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Private & Secure</h3>
            <p>Your thoughts are yours alone. End-to-end encryption keeps your journal safe.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Daily Summaries</h3>
            <p>AI-powered insights help you track patterns and growth over time.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌙</div>
            <h3>Mood Tracking</h3>
            <p>Understand your emotional patterns with intelligent mood analysis.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            EchoQuill
          </div>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
          <div className="footer-social">
            <p>© 2024 EchoQuill. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 