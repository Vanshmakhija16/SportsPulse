import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">

        <div className="footer-brand">
          <div className="footer-logo">
            <span>⚡</span>
            <span className="footer-name">SPORTS<em>PULSE</em></span>
          </div>
          <p>Empowering college sports culture — one event at a time.</p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>Platform</h4>
            <Link to="/events">Browse Events</Link>
            <Link to="/leaderboard">Leaderboard</Link>
            <Link to="/teams">Teams</Link>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/register">Sign Up</Link>
            <Link to="/login">Login</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
        </div>

      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>© 2024 SportsPulse &nbsp;·&nbsp; Built for college athletes 🏆</p>
        </div>
      </div>
    </footer>
  );
}
