import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    close();
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner container">

        <Link to="/" className="navbar-brand" onClick={close}>
          <span className="brand-lightning">⚡</span>
          <span className="brand-name">SPORTS<span>PULSE</span></span>
        </Link>

        <button
          className={`menu-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>

        <div className={`navbar-center ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/events"      onClick={close}>Events</NavLink>
          <NavLink to="/leaderboard" onClick={close}>Leaderboard</NavLink>
          {user && <NavLink to="/teams"     onClick={close}>Teams</NavLink>}
          {user && <NavLink to="/dashboard" onClick={close}>Dashboard</NavLink>}
          {user && (user.role === 'admin' || user.role === 'coach') && (
            <NavLink to="/admin" onClick={close} className="nav-admin">Admin ⚙</NavLink>
          )}
        </div>

        <div className={`navbar-right ${menuOpen ? 'open' : ''}`}>
          {user ? (
            <div className="user-row">
              <div className="user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
              <span className="user-name">{user.name?.split(' ')[0]}</span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <>
              <Link to="/login"    className="btn btn-outline btn-sm" onClick={close}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={close}>Sign Up</Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
