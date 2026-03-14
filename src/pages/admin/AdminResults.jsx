import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import './Admin.css';

const emptyForm = {
  event: '', position: 1, participant: '', team: '',
  score: '', medal: 'none', college: '', notes: ''
};

export default function AdminResults() {
  const [events,        setEvents]        = useState([]);
  const [results,       setResults]       = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedEvent, setSelected]      = useState('');
  const [currentEvent,  setCurrentEvent]  = useState(null);
  const [form,          setForm]          = useState(emptyForm);
  const [submitting,    setSubmitting]    = useState(false);
  const [regTab,        setRegTab]        = useState('registrations'); // 'registrations' | 'results'

  useEffect(() => {
    api.get('/events').then(res => setEvents(res.data));
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;
    setForm(f => ({ ...f, event: selectedEvent, participant: '', team: '' }));

    // Load event details
    const ev = events.find(e => e._id === selectedEvent);
    setCurrentEvent(ev || null);

    api.get(`/results/event/${selectedEvent}`).then(res => setResults(res.data));
    api.get(`/registrations/event/${selectedEvent}`)
      .then(res => setRegistrations(res.data))
      .catch(() => setRegistrations([]));
  }, [selectedEvent]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // When admin picks a registration entry, auto-fill college
  const handleRegChange = e => {
    const regId = e.target.value;
    const reg   = registrations.find(r => r._id === regId);
    if (!reg) return;

    if (reg.type === 'team' && reg.team) {
      set('team',        reg.team._id);
      set('participant', '');
      set('college',     reg.team.college || '');
    } else {
      set('participant', reg.participant?._id || '');
      set('team',        '');
      set('college',     reg.participant?.college || '');
    }
    // store regId in form so we can display
    setForm(f => ({ ...f, _regId: regId }));
  };

  const submit = async e => {
    e.preventDefault();
    const isTeamEvent = currentEvent?.category === 'team';

    if (isTeamEvent && !form.team) {
      toast.error('Please select a team'); return;
    }
    if (!isTeamEvent && !form.participant) {
      toast.error('Please select a participant'); return;
    }

    setSubmitting(true);
    try {
      const payload = {
        event:    form.event,
        position: form.position,
        medal:    form.medal,
        score:    form.score,
        college:  form.college,
        notes:    form.notes,
        ...(isTeamEvent
          ? { team:        form.team }
          : { participant: form.participant })
      };

      await api.post('/results', payload);
      toast.success('Result recorded!');
      api.get(`/results/event/${selectedEvent}`).then(res => setResults(res.data));
      setForm(f => ({
        ...f,
        position: f.position + 1,
        participant: '', team: '', _regId: '',
        score: '', medal: 'none', college: '', notes: ''
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record result');
    } finally { setSubmitting(false); }
  };

  const deleteResult = async id => {
    if (!window.confirm('Delete this result?')) return;
    try {
      await api.delete(`/results/${id}`);
      toast.success('Result deleted');
      setResults(r => r.filter(res => res._id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const updateRegStatus = async (id, status) => {
    try {
      await api.put(`/registrations/${id}/status`, { status });
      setRegistrations(r => r.map(reg => reg._id === id ? { ...reg, status } : reg));
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const medalEmoji = m => m === 'gold' ? '🥇' : m === 'silver' ? '🥈' : m === 'bronze' ? '🥉' : null;
  const isTeamEvent = currentEvent?.category === 'team';

  // Individual regs
  const individualRegs = registrations.filter(r => r.type === 'individual');
  // Team regs (unique teams)
  const teamRegs = registrations.filter(r => r.type === 'team');

  return (
    <div className="admin-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Manage <span className="neon-text">Registrations & Results</span></h1>
        </div>

        {/* Event selector */}
        <div className="form-group" style={{ maxWidth: 520, marginBottom: 36 }}>
          <label className="form-label">Select Event *</label>
          <select className="form-input" value={selectedEvent} onChange={e => setSelected(e.target.value)}>
            <option value="">-- Choose an event --</option>
            {events.map(e => (
              <option key={e._id} value={e._id}>
                {e.title} ({e.sport}) [{e.category}]
              </option>
            ))}
          </select>
        </div>

        {selectedEvent && currentEvent && (
          <>
            {/* Event Info Bar */}
            <div className="event-info-bar">
              <div className="eib-item">
                <small>Event Type</small>
                <span className={`badge badge-${currentEvent.category}`}>{currentEvent.category}</span>
              </div>
              {isTeamEvent && (
                <>
                  <div className="eib-item">
                    <small>Min Team Size</small>
                    <strong>{currentEvent.minTeamSize} players</strong>
                  </div>
                  <div className="eib-item">
                    <small>Max Team Size</small>
                    <strong>{currentEvent.maxTeamSize} players</strong>
                  </div>
                </>
              )}
              <div className="eib-item">
                <small>Total Registrations</small>
                <strong>{registrations.length}</strong>
              </div>
              <div className="eib-item">
                <small>Status</small>
                <span className={`badge badge-${currentEvent.status}`}>{currentEvent.status}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="team-tabs" style={{ marginBottom: 28 }}>
              <button className={`team-tab ${regTab === 'registrations' ? 'active' : ''}`}
                onClick={() => setRegTab('registrations')}>
                📋 Registrations ({registrations.length})
              </button>
              <button className={`team-tab ${regTab === 'results' ? 'active' : ''}`}
                onClick={() => setRegTab('results')}>
                🏆 Record Results
              </button>
            </div>

            {/* ── REGISTRATIONS TAB ── */}
            {regTab === 'registrations' && (
              <div className="card">
                <div className="card-body">
                  {isTeamEvent ? (
                    /* TEAM registrations view */
                    teamRegs.length > 0 ? (
                      <div className="team-regs-list">
                        {teamRegs.map((reg, i) => (
                          <div key={reg._id} className="team-reg-card">
                            <div className="trc-header">
                              <div className="trc-rank">#{i + 1}</div>
                              <div className="trc-info">
                                <h3>{reg.team?.name || 'Unknown Team'}</h3>
                                <p>{reg.team?.college}</p>
                              </div>
                              <div className="trc-meta">
                                <div className="trc-size">
                                  <span className={
                                    reg.team?.members?.length >= currentEvent.minTeamSize
                                      ? 'size-ok' : 'size-warn'
                                  }>
                                    👥 {reg.team?.members?.length || 0} members
                                    {reg.team?.members?.length < currentEvent.minTeamSize
                                      ? ` ⚠️ (min ${currentEvent.minTeamSize})`
                                      : ' ✅'}
                                  </span>
                                </div>
                                <select
                                  className="form-input status-select"
                                  value={reg.status}
                                  onChange={e => updateRegStatus(reg._id, e.target.value)}>
                                  <option value="pending">Pending</option>
                                  <option value="approved">Approved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </div>
                            </div>

                            {/* Members table */}
                            <div className="trc-members">
                              <table className="table members-table">
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Department</th>
                                    <th>Year</th>
                                    <th>Role</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {reg.team?.members?.map((m, mi) => (
                                    <tr key={mi}>
                                      <td>{mi + 1}</td>
                                      <td><strong>{m.user?.name || '—'}</strong></td>
                                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.user?.email}</td>
                                      <td>{m.user?.department || '—'}</td>
                                      <td>{m.user?.year ? `Year ${m.user.year}` : '—'}</td>
                                      <td>
                                        <span className={`role-badge ${m.role === 'captain' ? 'captain' : 'member'}`}>
                                          {m.role === 'captain' ? '👑 Captain' : 'Member'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Join code */}
                            {reg.team?.joinCode && (
                              <div className="trc-code">
                                Join Code: <strong>{reg.team.joinCode}</strong>
                                <span className={`badge badge-${reg.status}`} style={{ marginLeft: 12 }}>{reg.status}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state" style={{ padding: '40px 0' }}>
                        <div className="empty-state-icon">👥</div>
                        <h3>No team registrations yet</h3>
                        <p>Teams will appear here once they register</p>
                      </div>
                    )
                  ) : (
                    /* INDIVIDUAL registrations view */
                    individualRegs.length > 0 ? (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>College</th>
                            <th>Dept / Year</th>
                            <th>Phone</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {individualRegs.map((reg, i) => (
                            <tr key={reg._id}>
                              <td>{i + 1}</td>
                              <td><strong>{reg.participant?.name}</strong></td>
                              <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{reg.participant?.email}</td>
                              <td>{reg.participant?.college}</td>
                              <td style={{ fontSize: '0.82rem' }}>
                                {reg.participant?.department || '—'}
                                {reg.participant?.year ? ` · Y${reg.participant.year}` : ''}
                              </td>
                              <td style={{ fontSize: '0.82rem' }}>{reg.participant?.phone || '—'}</td>
                              <td>
                                <select
                                  className="form-input status-select"
                                  value={reg.status}
                                  onChange={e => updateRegStatus(reg._id, e.target.value)}>
                                  <option value="pending">Pending</option>
                                  <option value="approved">Approved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="empty-state" style={{ padding: '40px 0' }}>
                        <div className="empty-state-icon">🧍</div>
                        <h3>No individual registrations yet</h3>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* ── RECORD RESULTS TAB ── */}
            {regTab === 'results' && (
              <div className="results-two-col">
                {/* Form */}
                <div className="card">
                  <div className="card-body">
                    <h3 className="admin-section-title">Add Result Entry</h3>
                    <form onSubmit={submit} style={{ marginTop: 20 }}>

                      {/* Pick Team or Participant from dropdown */}
                      <div className="form-group">
                        <label className="form-label">
                          {isTeamEvent ? 'Select Team *' : 'Select Participant *'}
                        </label>
                        <select
                          className="form-input"
                          value={form._regId || ''}
                          onChange={handleRegChange}
                          required>
                          <option value="">
                            {isTeamEvent ? 'Select registered team' : 'Select registered participant'}
                          </option>
                          {registrations.map(r => (
                            <option key={r._id} value={r._id}>
                              {isTeamEvent
                                ? `${r.team?.name || 'Unknown'} — ${r.team?.members?.length || 0} members (${r.team?.college})`
                                : `${r.participant?.name} — ${r.participant?.college}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Position *</label>
                          <input className="form-input" type="number"
                            value={form.position}
                            onChange={e => set('position', Number(e.target.value))}
                            min={1} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Medal</label>
                          <select className="form-input" value={form.medal} onChange={e => set('medal', e.target.value)}>
                            <option value="none">No Medal</option>
                            <option value="gold">🥇 Gold</option>
                            <option value="silver">🥈 Silver</option>
                            <option value="bronze">🥉 Bronze</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Score / Time</label>
                          <input className="form-input" value={form.score}
                            onChange={e => set('score', e.target.value)}
                            placeholder="e.g. 12.4s / 245 pts" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">College</label>
                          <input className="form-input" value={form.college}
                            onChange={e => set('college', e.target.value)}
                            placeholder="Auto-filled" />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Notes (optional)</label>
                        <input className="form-input" value={form.notes}
                          onChange={e => set('notes', e.target.value)}
                          placeholder="Any notes..." />
                      </div>

                      <button type="submit" className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={submitting}>
                        {submitting ? 'Recording...' : '🏆 Record Result'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Results list */}
                <div className="card">
                  <div className="card-body">
                    <h3 className="admin-section-title">Recorded Results ({results.length})</h3>
                    {results.length > 0 ? (
                      <div style={{ marginTop: 16 }}>
                        {results.sort((a, b) => a.position - b.position).map(r => (
                          <div key={r._id} className="recorded-row">
                            <div className="recorded-medal">
                              {medalEmoji(r.medal) || `#${r.position}`}
                            </div>
                            <div className="recorded-info" style={{ flex: 1 }}>
                              <strong>{r.team?.name || r.participant?.name || 'Unknown'}</strong>
                              <span>{r.college}</span>
                            </div>
                            {r.score && <div className="recorded-score">{r.score}</div>}
                            <button className="btn btn-danger btn-sm" style={{ marginLeft: 8 }}
                              onClick={() => deleteResult(r._id)}>✕</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏅</div>
                        <p>No results yet. Use the form to add.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!selectedEvent && (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>Select an event above</h3>
            <p>Choose an event to manage registrations and record results</p>
          </div>
        )}
      </div>
    </div>
  );
}
