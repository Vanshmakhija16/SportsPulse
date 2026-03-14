import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Admin.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="admin-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Admin <span className="neon-text">Dashboard</span></h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
              Welcome back, {user?.name?.split(' ')[0]} ⚡
            </p>
          </div>
          <Link to="/admin/events" className="btn btn-primary">+ Create Event</Link>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          {[
            { label: 'Total Students',    value: stats?.totalUsers,         icon: '👥', color: 'cyan'   },
            { label: 'Total Events',      value: stats?.totalEvents,        icon: '🏟️', color: 'orange' },
            { label: 'Registrations',     value: stats?.totalRegistrations, icon: '📋', color: 'green'  },
            { label: 'Upcoming Events',   value: stats?.upcomingEvents,     icon: '📅', color: 'purple' },
          ].map(s => (
            <div key={s.label} className={`admin-stat-card color-${s.color}`}>
              <div className="admin-stat-icon">{s.icon}</div>
              <div className="stat-number">{s.value ?? 0}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="admin-two-col">
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <h3 className="admin-section-title">Recent Events</h3>
                <Link to="/admin/events" className="btn btn-outline btn-sm">Manage →</Link>
              </div>
              {stats?.recentEvents?.length > 0 ? stats.recentEvents.map(e => (
                <div key={e._id} className="admin-list-item">
                  <div>
                    <strong>{e.title}</strong>
                    <p>{e.sport} &nbsp;·&nbsp; {new Date(e.startDate).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className={`badge badge-${e.status}`}>{e.status}</span>
                </div>
              )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No events yet</p>}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <h3 className="admin-section-title">Recent Registrations</h3>
                <Link to="/admin/users" className="btn btn-outline btn-sm">Users →</Link>
              </div>
              {stats?.recentRegistrations?.length > 0 ? stats.recentRegistrations.map(r => (
                <div key={r._id} className="admin-list-item">
                  <div>
                    <strong>{r.participant?.name || 'Unknown'}</strong>
                    <p>{r.event?.title}</p>
                  </div>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </div>
              )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No registrations yet</p>}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="admin-section-title" style={{ marginBottom: 20 }}>Quick Actions</h2>
        <div className="quick-actions-grid">
          {[
            { icon: '🏟️', label: 'Manage Events',  to: '/admin/events',  desc: 'Create, edit and delete sports events' },
            { icon: '👥', label: 'Manage Users',   to: '/admin/users',   desc: 'View users and change roles' },
            { icon: '🏆', label: 'Record Results', to: '/admin/results', desc: 'Enter results and award medals' },
            { icon: '📊', label: 'Leaderboard',    to: '/leaderboard',   desc: 'View college-wide standings' },
          ].map(l => (
            <Link key={l.to} to={l.to} className="quick-action-card">
              <div className="qa-icon">{l.icon}</div>
              <h4>{l.label}</h4>
              <p>{l.desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
