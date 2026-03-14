import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import './Admin.css';

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    api.get('/admin/users')
      .then(res => setUsers(res.data))
      .finally(() => setLoading(false));
  }, []);

  const updateRole = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}`, { role });
      setUsers(u => u.map(usr => usr._id === id ? { ...usr, role } : usr));
      toast.success('Role updated successfully');
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      await api.put(`/admin/users/${id}`, { isActive: !isActive });
      setUsers(u => u.map(usr => usr._id === id ? { ...usr, isActive: !isActive } : usr));
      toast.success(isActive ? 'User deactivated' : 'User activated');
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.college?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts = {
    all:     users.length,
    student: users.filter(u => u.role === 'student').length,
    coach:   users.filter(u => u.role === 'coach').length,
    admin:   users.filter(u => u.role === 'admin').length,
  };

  return (
    <div className="admin-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Manage <span className="neon-text">Users</span></h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>{users.length} total registered users</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="admin-stats" style={{ marginBottom: 28 }}>
          {[
            { label: 'All Users',  value: counts.all,     color: 'cyan'   },
            { label: 'Students',   value: counts.student,  color: 'purple' },
            { label: 'Coaches',    value: counts.coach,    color: 'orange' },
            { label: 'Admins',     value: counts.admin,    color: 'green'  },
          ].map(s => (
            <div key={s.label} className={`admin-stat-card color-${s.color}`}>
              <div className="stat-number" style={{ fontSize: '2.2rem' }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <input className="form-input" style={{ flex: 1, maxWidth: 360 }}
            placeholder="🔍  Search by name, email or college..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-input" style={{ width: 160 }}
            value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="coach">Coach</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="loader" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>College</th>
                  <th>Dept / Year</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: '#00f5ff15', border: '1px solid #00f5ff33',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--neon-cyan)',
                          fontSize: '0.85rem', flexShrink: 0,
                        }}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>{u.name}</strong>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ fontSize: '0.85rem' }}>{u.college}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {u.department || '—'}{u.year ? ` · Y${u.year}` : ''}
                    </td>
                    <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 700,
                        color: u.isActive ? 'var(--neon-green)' : '#ff3366',
                      }}>
                        {u.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <select
                        className="form-input"
                        style={{ padding: '4px 8px', fontSize: '0.78rem', width: 'auto' }}
                        value={u.role}
                        onChange={e => updateRole(u._id, e.target.value)}>
                        <option value="student">Student</option>
                        <option value="coach">Coach</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No users found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
