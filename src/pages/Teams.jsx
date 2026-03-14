import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Teams.css';

export default function Teams() {
  const { user } = useAuth();
  const [events,        setEvents]       = useState([]);
  const [teams,         setTeams]        = useState([]);
  const [myTeams,       setMyTeams]      = useState([]);
  const [selectedEvent, setSelected]     = useState('');
  const [loading,       setLoading]      = useState(false);
  const [showCreate,    setShowCreate]   = useState(false);
  const [showJoin,      setShowJoin]     = useState(false);
  const [createForm,    setCreateForm]   = useState({ name: '', eventId: '' });
  const [joinCode,      setJoinCode]     = useState('');
  const [tab,           setTab]          = useState('browse');

  useEffect(() => {
    api.get('/events?category=team').then(res => setEvents(res.data));
    api.get('/teams/my').then(res => setMyTeams(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;
    setLoading(true);
    api.get(`/teams/event/${selectedEvent}`)
      .then(res => setTeams(res.data))
      .finally(() => setLoading(false));
  }, [selectedEvent]);

  const refreshMyTeams = () =>
    api.get('/teams/my').then(res => setMyTeams(res.data)).catch(() => {});

  const createTeam = async e => {
    e.preventDefault();
    try {
      await api.post('/teams', createForm);
      toast.success('Team created! Share the join code with teammates.');
      setShowCreate(false);
      setCreateForm({ name: '', eventId: '' });
      refreshMyTeams();
      if (selectedEvent === createForm.eventId)
        api.get(`/teams/event/${selectedEvent}`).then(res => setTeams(res.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create team');
    }
  };

  const joinTeam = async e => {
    e.preventDefault();
    try {
      await api.post('/teams/join', { joinCode: joinCode.toUpperCase() });
      toast.success('Joined team successfully!');
      setShowJoin(false);
      setJoinCode('');
      refreshMyTeams();
      if (selectedEvent)
        api.get(`/teams/event/${selectedEvent}`).then(res => setTeams(res.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join team');
    }
  };

  return (
    <div className="teams-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Team <span className="neon-text">Management</span></h1>
          <div className="teams-header-actions">
            <button className="btn btn-outline" onClick={() => setShowJoin(true)}>🔗 Join with Code</button>
            <button className="btn btn-primary"  onClick={() => setShowCreate(true)}>+ Create Team</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="team-tabs">
          <button className={`team-tab ${tab === 'browse' ? 'active' : ''}`} onClick={() => setTab('browse')}>Browse Teams</button>
          <button className={`team-tab ${tab === 'my'     ? 'active' : ''}`} onClick={() => setTab('my')}>My Teams ({myTeams.length})</button>
        </div>

        {/* Browse Tab */}
        {tab === 'browse' && (
          <>
            <div className="form-group" style={{ maxWidth: 480, marginBottom: 32 }}>
              <label className="form-label">Select Event to View Teams</label>
              <select className="form-input" value={selectedEvent} onChange={e => setSelected(e.target.value)}>
                <option value="">-- Choose a team event --</option>
                {events.map(e => (
                  <option key={e._id} value={e._id}>{e.title} ({e.sport})</option>
                ))}
              </select>
            </div>

            {!selectedEvent ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h3>Select an event above</h3>
                <p>Choose a team event to see all registered teams</p>
              </div>
            ) : loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <div className="loader" />
              </div>
            ) : teams.length > 0 ? (
              <div className="teams-grid">
                {teams.map(t => <TeamCard key={t._id} team={t} userId={user?._id} />)}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h3>No teams yet for this event</h3>
                <p>Be the first to create a team!</p>
                <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowCreate(true)}>
                  Create Team
                </button>
              </div>
            )}
          </>
        )}

        {/* My Teams Tab */}
        {tab === 'my' && (
          myTeams.length > 0 ? (
            <div className="teams-grid">
              {myTeams.map(t => <TeamCard key={t._id} team={t} userId={user?._id} showEvent />)}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏅</div>
              <h3>You haven't joined any teams yet</h3>
              <p>Create a new team or join one with a code</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
                <button className="btn btn-outline" onClick={() => setShowJoin(true)}>Join with Code</button>
                <button className="btn btn-primary"  onClick={() => setShowCreate(true)}>Create Team</button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create New Team</h2>
            <p className="modal-sub">You'll become captain and receive a shareable join code</p>
            <form onSubmit={createTeam}>
              <div className="form-group">
                <label className="form-label">Team Name *</label>
                <input className="form-input"
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Thunder Eagles" required />
              </div>
              <div className="form-group">
                <label className="form-label">Event *</label>
                <select className="form-input"
                  value={createForm.eventId}
                  onChange={e => setCreateForm(f => ({ ...f, eventId: e.target.value }))}
                  required>
                  <option value="">Select event</option>
                  {events
                    .filter(e => e.status === 'upcoming' || e.status === 'ongoing')
                    .map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Join a Team</h2>
            <p className="modal-sub">Enter the 6-character code shared by your team captain</p>
            <form onSubmit={joinTeam}>
              <div className="form-group">
                <label className="form-label">Join Code *</label>
                <input className="form-input join-code-input"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="AB1C2D"
                  maxLength={6} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowJoin(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Join Team</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TeamCard({ team, userId, showEvent = false }) {
  const isCaptain = team.captain?._id === userId || team.captain === userId;
  const isMember  = team.members?.some(m => (m.user?._id || m.user) === userId);
  const filled    = team.members?.length || 0;
  const max       = team.maxSize || 1;

  const copyCode = () => {
    navigator.clipboard.writeText(team.joinCode);
    toast.success('Join code copied!');
  };

  return (
    <div className={`team-card ${isMember ? 'team-card-mine' : ''}`}>
      <div className="tc-header">
        <div>
          <span className={`badge badge-${team.status === 'complete' ? 'ongoing' : 'upcoming'}`}>{team.status}</span>
          <h3 className="tc-name">{team.name}</h3>
          <p className="tc-college">{team.college}</p>
          {showEvent && team.event && (
            <p className="tc-event">🏟️ {team.event?.title} — {team.event?.sport}</p>
          )}
        </div>
        <div className="tc-role-badges">
          {isCaptain && <span className="role-badge captain">👑 Captain</span>}
          {isMember && !isCaptain && <span className="role-badge member">✓ Member</span>}
        </div>
      </div>

      <div className="tc-members-section">
        <div className="tc-members-label">{filled} / {max} members</div>
        <div className="tc-progress">
          <div className="tc-progress-fill" style={{ width: `${(filled / max) * 100}%` }} />
        </div>
        <div className="tc-members-list">
          {team.members?.map((m, i) => (
            <div key={i} className="tc-chip">
              <div className="tc-chip-ava">{(m.user?.name || '?').charAt(0).toUpperCase()}</div>
              <span>{m.user?.name?.split(' ')[0] || 'Unknown'}</span>
              {m.role === 'captain' && <span>👑</span>}
            </div>
          ))}
          {Array.from({ length: Math.max(0, max - filled) }).map((_, i) => (
            <div key={`empty-${i}`} className="tc-chip tc-chip-empty">
              <div className="tc-chip-ava tc-chip-ava-empty">+</div>
              <span>Open</span>
            </div>
          ))}
        </div>
      </div>

      {isCaptain && (
        <div className="tc-code-box">
          <span>Join Code:</span>
          <strong>{team.joinCode}</strong>
          <button className="copy-btn" type="button" onClick={copyCode}>Copy</button>
        </div>
      )}
    </div>
  );
}
