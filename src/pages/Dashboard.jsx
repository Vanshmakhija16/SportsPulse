import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/registrations/my')
      .then(res => setRegistrations(res.data))
      .finally(() => setLoading(false));
  }, []);

  const upcoming  = registrations.filter(r => r.event?.status === 'upcoming');
  const ongoing   = registrations.filter(r => r.event?.status === 'ongoing');
  const completed = registrations.filter(r => r.event?.status === 'completed');

  return (
    <div className="dashboard">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">My <span className="neon-text">Dashboard</span></h1>
          <Link to="/events" className="btn btn-primary">+ Browse Events</Link>
        </div>

        {/* Profile */}
        <div className="profile-card">
          <div className="profile-ava">{user?.name?.charAt(0).toUpperCase()}</div>
          <div className="profile-info">
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
            <div className="profile-meta">
              {user?.college    && <span>🏫 {user.college}</span>}
              {user?.department && <span>📚 {user.department}</span>}
              {user?.year       && <span>📅 Year {user.year}</span>}
              {user?.phone      && <span>📞 {user.phone}</span>}
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            </div>
          </div>
          <div className="profile-stats">
            <div className="stat-card"><div className="stat-number">{registrations.length}</div><div className="stat-label">Events Joined</div></div>
            <div className="stat-card"><div className="stat-number" style={{ color:'var(--neon-green)' }}>{ongoing.length}</div><div className="stat-label">Ongoing</div></div>
            <div className="stat-card"><div className="stat-number" style={{ color:'var(--text-secondary)' }}>{completed.length}</div><div className="stat-label">Completed</div></div>
          </div>
        </div>

        {/* Registrations */}
        <h2 className="dash-heading">My Registrations</h2>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
            <div className="loader" />
          </div>
        ) : registrations.length > 0 ? (
          <div className="reg-grid">
            {registrations.map(r => (
              <Link to={`/events/${r.event?._id}`} key={r._id} className="reg-card">
                <div className="rc-top">
                  <span className={`badge badge-${r.event?.status}`}>{r.event?.status}</span>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </div>
                <h3 className="rc-title">{r.event?.title || 'Event'}</h3>
                <p  className="rc-sport">{r.event?.sport}</p>
                <div className="rc-meta">
                  {r.event?.startDate && <span>📅 {new Date(r.event.startDate).toLocaleDateString('en-IN')}</span>}
                  {r.event?.venue     && <span>📍 {r.event.venue}</span>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🎽</div>
            <h3>No registrations yet</h3>
            <p>Browse events and register to get started!</p>
            <Link to="/events" className="btn btn-primary" style={{ marginTop:24 }}>Browse Events</Link>
          </div>
        )}
      </div>
    </div>
  );
}
