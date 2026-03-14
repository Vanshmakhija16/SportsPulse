import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './Admin.css';

const SPORTS = [
  'Cricket','Football','Basketball','Volleyball','Tennis','Badminton',
  'Chess','Athletics','Swimming','Kabaddi','Table Tennis','Handball',
  'Boxing','Wrestling','Cycling','Archery','Shooting','Gymnastics',
];

const emptyForm = {
  title: '', description: '', sport: 'Cricket', category: 'individual',
  venue: '', startDate: '', endDate: '', registrationDeadline: '',
  maxParticipants: 50, maxTeamSize: 5, minTeamSize: 2, college: '',
  prizes: { first: '', second: '', third: '' },
  rules: [''],
};

export default function AdminEvents() {
  const { user } = useAuth();
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState({ ...emptyForm, college: user?.college || '' });

  const load = () =>
    api.get('/events').then(res => setEvents(res.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setPrize = (k, v) => setForm(f => ({ ...f, prizes: { ...f.prizes, [k]: v } }));

  const openCreate = () => {
    setForm({ ...emptyForm, college: user?.college || '' });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = ev => {
    setForm({
      ...ev,
      startDate:             ev.startDate?.substring(0, 10) || '',
      endDate:               ev.endDate?.substring(0, 10)   || '',
      registrationDeadline:  ev.registrationDeadline?.substring(0, 10) || '',
      prizes: ev.prizes || { first: '', second: '', third: '' },
      rules:  ev.rules?.length ? ev.rules : [''],
    });
    setEditId(ev._id);
    setShowForm(true);
  };

  const submit = async e => {
    e.preventDefault();
    const payload = { ...form, rules: form.rules.filter(r => r.trim()) };
    try {
      if (editId) {
        await api.put(`/events/${editId}`, payload);
        toast.success('Event updated successfully!');
      } else {
        await api.post('/events', payload);
        toast.success('Event created successfully!');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    }
  };

  const deleteEvent = async id => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event deleted');
      load();
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/events/${id}`, { status });
      toast.success(`Status set to ${status}`);
      load();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="admin-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Manage <span className="neon-text">Events</span></h1>
          <button className="btn btn-primary" onClick={openCreate}>+ New Event</button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="loader" />
          </div>
        ) : events.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Sport</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Registrations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr key={e._id}>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>{e.title}</strong>
                      <br /><small style={{ color: 'var(--text-muted)' }}>{e.venue}</small>
                    </td>
                    <td>{e.sport}</td>
                    <td><span className={`badge badge-${e.category}`}>{e.category}</span></td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(e.startDate).toLocaleDateString('en-IN')}</td>
                    <td>
                      <select
                        className="form-input"
                        style={{ padding: '4px 8px', fontSize: '0.78rem', width: 'auto' }}
                        value={e.status}
                        onChange={ev => updateStatus(e._id, ev.target.value)}>
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                      {e.registrations?.length || 0} / {e.maxParticipants}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(e)}>Edit</button>
                        <button className="btn btn-danger btn-sm"  onClick={() => deleteEvent(e._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🏟️</div>
            <h3>No events yet</h3>
            <p>Create your first event to get started!</p>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={openCreate}>Create Event</button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <h2>{editId ? 'Edit Event' : 'Create New Event'}</h2>
            <p className="modal-sub" style={{ marginBottom: 28 }}>Fill in the details below</p>

            <form onSubmit={submit}>
              <div className="form-grid-3">
                <div className="form-group col-2">
                  <label className="form-label">Event Title *</label>
                  <input className="form-input" value={form.title}
                    onChange={e => set('title', e.target.value)}
                    placeholder="e.g. Inter-College Cricket Championship" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Sport *</label>
                  <select className="form-input" value={form.sport} onChange={e => set('sport', e.target.value)}>
                    {SPORTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group col-3">
                  <label className="form-label">Description *</label>
                  <textarea className="form-input" rows={3} value={form.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="Describe the event, eligibility, format..." required />
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-input" value={form.category} onChange={e => set('category', e.target.value)}>
                    <option value="individual">Individual</option>
                    <option value="team">Team</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Venue *</label>
                  <input className="form-input" value={form.venue}
                    onChange={e => set('venue', e.target.value)}
                    placeholder="e.g. Main Ground, Sports Hall" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Organising College *</label>
                  <input className="form-input" value={form.college}
                    onChange={e => set('college', e.target.value)}
                    placeholder="College name" required />
                </div>

                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input className="form-input" type="date" value={form.startDate}
                    onChange={e => set('startDate', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input className="form-input" type="date" value={form.endDate}
                    onChange={e => set('endDate', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Registration Deadline *</label>
                  <input className="form-input" type="date" value={form.registrationDeadline}
                    onChange={e => set('registrationDeadline', e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Participants</label>
                  <input className="form-input" type="number" value={form.maxParticipants}
                    onChange={e => set('maxParticipants', Number(e.target.value))} min={1} />
                </div>
                {form.category === 'team' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Min Team Size</label>
                      <input className="form-input" type="number" value={form.minTeamSize}
                        onChange={e => set('minTeamSize', Number(e.target.value))} min={2} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Max Team Size</label>
                      <input className="form-input" type="number" value={form.maxTeamSize}
                        onChange={e => set('maxTeamSize', Number(e.target.value))} min={2} />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">🥇 1st Prize</label>
                  <input className="form-input" value={form.prizes.first}
                    onChange={e => setPrize('first', e.target.value)} placeholder="e.g. ₹5000 + Trophy" />
                </div>
                <div className="form-group">
                  <label className="form-label">🥈 2nd Prize</label>
                  <input className="form-input" value={form.prizes.second}
                    onChange={e => setPrize('second', e.target.value)} placeholder="e.g. ₹3000 + Medal" />
                </div>
                <div className="form-group">
                  <label className="form-label">🥉 3rd Prize</label>
                  <input className="form-input" value={form.prizes.third}
                    onChange={e => setPrize('third', e.target.value)} placeholder="e.g. ₹1000 + Medal" />
                </div>
              </div>

              {/* Rules */}
              <div className="form-group">
                <label className="form-label">Rules / Guidelines</label>
                {form.rules.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input className="form-input" value={r}
                      onChange={e => {
                        const rules = [...form.rules];
                        rules[i] = e.target.value;
                        set('rules', rules);
                      }}
                      placeholder={`Rule ${i + 1}`} />
                    {form.rules.length > 1 && (
                      <button type="button" className="btn btn-danger btn-sm"
                        onClick={() => set('rules', form.rules.filter((_, j) => j !== i))}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm"
                  onClick={() => set('rules', [...form.rules, ''])}>+ Add Rule</button>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update Event' : 'Create Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
