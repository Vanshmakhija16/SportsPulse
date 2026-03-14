import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './EventDetail.css';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event,         setEvent]        = useState(null);
  const [results,       setResults]      = useState([]);
  const [loading,       setLoading]      = useState(true);
  const [registering,   setRegistering]  = useState(false);
  const [isRegistered,  setIsRegistered] = useState(false);

  // Team modal states
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [myTeams,       setMyTeams]       = useState([]);
  const [loadingTeams,  setLoadingTeams]  = useState(false);
  const [teamOption,    setTeamOption]    = useState('create'); // 'existing' | 'create' | 'join'
  const [selectedTeam,  setSelectedTeam]  = useState('');
  const [newTeamName,   setNewTeamName]   = useState('');
  const [joinCode,      setJoinCode]      = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/events/${id}`),
      api.get(`/results/event/${id}`)
    ]).then(([eRes, rRes]) => {
      setEvent(eRes.data);
      setResults(rRes.data);
    }).catch(() => toast.error('Failed to load event'))
      .finally(() => setLoading(false));

    if (user) {
      api.get('/registrations/my').then(res => {
        setIsRegistered(res.data.some(r => r.event?._id === id || r.event === id));
      }).catch(() => {});
    }
  }, [id, user]);

  // Load user's existing teams when modal opens
  useEffect(() => {
    if (!showTeamModal || !event) return;
    setLoadingTeams(true);
    api.get('/teams/my')
      .then(res => {
        // only teams for THIS event
        const forThisEvent = res.data.filter(
          t => t.event?._id === id || t.event === id
        );
        setMyTeams(forThisEvent);
        if (forThisEvent.length > 0) {
          setTeamOption('existing');
          setSelectedTeam(forThisEvent[0]._id);
        } else {
          setTeamOption('create');
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTeams(false));
  }, [showTeamModal]);

  // ── Individual register ──────────────────────────────
  const registerIndividual = async () => {
    if (!user) { navigate('/login'); return; }
    setRegistering(true);
    try {
      await api.post('/registrations', { eventId: id, type: 'individual' });
      setIsRegistered(true);
      setEvent(e => ({ ...e, registrations: [...(e.registrations || []), {}] }));
      toast.success('🎉 Registered successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setRegistering(false); }
  };

  // ── Team register ────────────────────────────────────
  const registerWithTeam = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setRegistering(true);

    try {
      let teamId    = selectedTeam;
      let teamName  = '';

      // A — Create new team first
      if (teamOption === 'create') {
        if (!newTeamName.trim()) {
          toast.error('Please enter a team name');
          setRegistering(false); return;
        }
        const res = await api.post('/teams', { name: newTeamName, eventId: id });
        teamId   = res.data.team._id;
        teamName = res.data.team.name;
        toast(`Team "${teamName}" created! Join code: ${res.data.team.joinCode}`, { icon: '👑', duration: 6000 });
      }

      // B — Join by code first
      if (teamOption === 'join') {
        if (!joinCode.trim()) {
          toast.error('Please enter a join code');
          setRegistering(false); return;
        }
        const res = await api.post('/teams/join', { joinCode: joinCode.toUpperCase() });
        teamId   = res.data.team._id;
        teamName = res.data.team.name;
        // Reload teams to check member count
        const teamsRes = await api.get('/teams/my');
        const updated  = teamsRes.data.find(t => t._id === teamId);
        if (updated) {
          setMyTeams(prev => {
            const exists = prev.find(t => t._id === teamId);
            return exists ? prev.map(t => t._id === teamId ? updated : t) : [...prev, updated];
          });
          setSelectedTeam(teamId);
        }
      }

      // C — Use existing team → validate member count before calling API
      if (teamOption === 'existing') {
        const team = myTeams.find(t => t._id === selectedTeam);
        if (!team) {
          toast.error('Please select a team');
          setRegistering(false); return;
        }
        const memberCount = team.members?.length || 0;
        const minSize     = event.minTeamSize || 1;
        const maxSize     = event.maxTeamSize || 99;

        if (memberCount < minSize) {
          toast.error(
            `Your team has only ${memberCount} member(s). Need at least ${minSize} to register.`,
            { duration: 5000 }
          );
          setRegistering(false); return;
        }
        if (memberCount > maxSize) {
          toast.error(
            `Your team has ${memberCount} members. Maximum allowed is ${maxSize}.`,
            { duration: 5000 }
          );
          setRegistering(false); return;
        }
        teamId = selectedTeam;
      }

      // Now register the team for the event
      await api.post('/registrations', { eventId: id, teamId, type: 'team' });
      setIsRegistered(true);
      setEvent(ev => ({ ...ev, registrations: [...(ev.registrations || []), {}] }));
      setShowTeamModal(false);
      toast.success('🎉 Team registered for event!');

    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setRegistering(false); }
  };

  // ── Handle register button click ─────────────────────
  const handleRegisterClick = () => {
    if (!user) { navigate('/login'); return; }
    if (event.category === 'team') {
      setShowTeamModal(true);
    } else {
      registerIndividual();
    }
  };

  // ────────────────────────────────────────────────────
  if (loading) return <div className="loading-screen"><div className="loader" /></div>;
  if (!event)  return (
    <div className="container" style={{ padding:'80px 0', textAlign:'center', color:'var(--text-muted)' }}>
      Event not found.
    </div>
  );

  const total        = event.maxParticipants || 1;
  const filled       = event.registrations?.length || 0;
  const spotsLeft    = total - filled;
  const deadlinePast = new Date() > new Date(event.registrationDeadline);
  const startDate    = new Date(event.startDate).toLocaleDateString('en-IN',
    { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const endDate      = new Date(event.endDate).toLocaleDateString('en-IN',
    { year:'numeric', month:'long', day:'numeric' });
  const deadline     = new Date(event.registrationDeadline).toLocaleDateString('en-IN',
    { day:'numeric', month:'long', year:'numeric' });

  // helper: member count of currently selected existing team
  const selectedTeamData  = myTeams.find(t => t._id === selectedTeam);
  const selectedMemberCount = selectedTeamData?.members?.length || 0;
  const minSize = event.minTeamSize || 1;
  const maxSize = event.maxTeamSize || 99;
  const teamSizeOk =
    teamOption !== 'existing' ||
    (selectedMemberCount >= minSize && selectedMemberCount <= maxSize);

  return (
    <div className="event-detail fade-in">

      {/* ── Hero ── */}
      <div className="ed-hero">
        <div className="ed-hero-bg" />
        <div className="container ed-hero-content">
          <div className="ed-hero-badges">
            <span className={`badge badge-${event.status}`}>{event.status}</span>
            <span className={`badge badge-${event.category}`}>{event.category}</span>
            <span className="ed-sport-label">{event.sport}</span>
          </div>
          <h1 className="ed-title">{event.title}</h1>
          <p className="ed-college">🏫 {event.college}</p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container ed-body">
        <div className="ed-layout">

          {/* ── Left / Main ── */}
          <div className="ed-main">
            <div className="card">
              <div className="card-body">
                <h2>About This Event</h2>
                <p className="ed-description">{event.description}</p>
              </div>
            </div>

            {/* Team event info box */}
            {event.category === 'team' && (
              <div className="card team-info-card" style={{ marginTop: 20 }}>
                <div className="card-body">
                  <h2>👥 Team Registration Info</h2>
                  <p style={{ color:'var(--text-secondary)', marginTop:10, lineHeight:1.8 }}>
                    This is a <strong style={{ color:'var(--neon-orange)' }}>team event</strong>.
                    Your team must have between&nbsp;
                    <strong style={{ color:'var(--neon-cyan)' }}>{event.minTeamSize}</strong> and&nbsp;
                    <strong style={{ color:'var(--neon-cyan)' }}>{event.maxTeamSize}</strong> players
                    to be eligible to register.
                  </p>

                  {/* Size requirement bar */}
                  <div className="size-req-bar">
                    <div className="srb-label">Team size requirement</div>
                    <div className="srb-track">
                      <div className="srb-range"
                        style={{
                          left:  `${(event.minTeamSize / event.maxTeamSize) * 100 - (event.minTeamSize / event.maxTeamSize) * 100}%`,
                          width: '100%'
                        }}>
                      </div>
                    </div>
                    <div className="srb-numbers">
                      <span>Min: {event.minTeamSize} players</span>
                      <span>Max: {event.maxTeamSize} players</span>
                    </div>
                  </div>

                  <div className="team-reg-steps">
                    <div className="trs-item">
                      <div className="trs-num">1</div>
                      <div>
                        <strong>Create a team</strong> — become the captain and receive a 6-char join code
                      </div>
                    </div>
                    <div className="trs-item">
                      <div className="trs-num">2</div>
                      <div>
                        <strong>Share your join code</strong> — invite {event.minTeamSize - 1}–{event.maxTeamSize - 1} teammates
                      </div>
                    </div>
                    <div className="trs-item">
                      <div className="trs-num">3</div>
                      <div>
                        <strong>Register once team is full</strong> — team must have {event.minTeamSize}–{event.maxTeamSize} players
                      </div>
                    </div>
                  </div>

                  <p style={{ marginTop:16, fontSize:'0.85rem', color:'var(--text-muted)' }}>
                    Manage your teams on the&nbsp;
                    <Link to="/teams" style={{ color:'var(--neon-cyan)' }}>Teams page →</Link>
                  </p>
                </div>
              </div>
            )}

            {event.rules?.length > 0 && (
              <div className="card" style={{ marginTop: 20 }}>
                <div className="card-body">
                  <h2>Rules &amp; Guidelines</h2>
                  <ol className="rules-list">
                    {event.rules.map((r, i) => <li key={i}>{r}</li>)}
                  </ol>
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div className="card" style={{ marginTop: 20 }}>
                <div className="card-body">
                  <h2>Results</h2>
                  <div className="results-list">
                    {results.map(r => (
                      <div key={r._id} className={`result-row medal-${r.medal}`}>
                        <div className="rr-pos">
                          {r.medal==='gold'?'🥇':r.medal==='silver'?'🥈':r.medal==='bronze'?'🥉':`#${r.position}`}
                        </div>
                        <div className="rr-info">
                          <strong>{r.team?.name || r.participant?.name || 'Unknown'}</strong>
                          <span>{r.college}</span>
                        </div>
                        {r.score && <div className="rr-score">{r.score}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="ed-sidebar">
            <div className="card register-card">
              <div className="card-body">
                <div className="spots-row">
                  <span className="spots-big">{spotsLeft}</span>
                  <span className="spots-label">spots remaining</span>
                </div>
                <div className="spots-bar" style={{ margin:'10px 0 6px' }}>
                  <div className="spots-fill" style={{ width:`${Math.min(100,(filled/total)*100)}%` }} />
                </div>
                <small className="spots-sub">{filled} / {total} registered</small>

                <div className="reg-type-hint">
                  {event.category === 'team'
                    ? `👥 Team event · ${event.minTeamSize}–${event.maxTeamSize} players`
                    : '🧍 Individual registration'}
                </div>

                <div style={{ marginTop: 16 }}>
                  {isRegistered ? (
                    <div className="reg-badge-success">✅ You're Registered!</div>
                  ) : event.status === 'completed' ? (
                    <div className="reg-badge-closed">Event Completed</div>
                  ) : deadlinePast ? (
                    <div className="reg-badge-closed">Registration Closed</div>
                  ) : spotsLeft <= 0 ? (
                    <div className="reg-badge-closed">Event Full</div>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ width:'100%', justifyContent:'center' }}
                      onClick={handleRegisterClick}
                      disabled={registering}>
                      {registering
                        ? 'Registering...'
                        : event.category === 'team'
                          ? '👥 Register as Team'
                          : '🚀 Register Now'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-body">
                <h3 className="sidebar-heading">Event Details</h3>
                <div className="detail-list">
                  <div className="detail-item"><span>📅</span><div><small>Start</small><p>{startDate}</p></div></div>
                  <div className="detail-item"><span>🏁</span><div><small>End</small><p>{endDate}</p></div></div>
                  <div className="detail-item"><span>📍</span><div><small>Venue</small><p>{event.venue}</p></div></div>
                  <div className="detail-item"><span>⏰</span><div><small>Reg. Deadline</small><p>{deadline}</p></div></div>
                  {event.category === 'team' && (
                    <div className="detail-item">
                      <span>👥</span>
                      <div>
                        <small>Team Size</small>
                        <p>{event.minTeamSize} – {event.maxTeamSize} players</p>
                      </div>
                    </div>
                  )}
                  <div className="detail-item"><span>🏟️</span><div><small>College</small><p>{event.college}</p></div></div>
                </div>
              </div>
            </div>

            {(event.prizes?.first || event.prizes?.second || event.prizes?.third) && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className="card-body">
                  <h3 className="sidebar-heading">🏆 Prizes</h3>
                  {event.prizes?.first  && <div className="prize-row"><span>🥇</span><div><small>1st Place</small><p>{event.prizes.first}</p></div></div>}
                  {event.prizes?.second && <div className="prize-row"><span>🥈</span><div><small>2nd Place</small><p>{event.prizes.second}</p></div></div>}
                  {event.prizes?.third  && <div className="prize-row"><span>🥉</span><div><small>3rd Place</small><p>{event.prizes.third}</p></div></div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Team Registration Modal ── */}
      {showTeamModal && (
        <div className="modal-overlay" onClick={() => setShowTeamModal(false)}>
          <div className="modal team-modal" onClick={e => e.stopPropagation()}>
            <h2>👥 Register as Team</h2>
            <p className="modal-sub">
              {event.sport} &nbsp;·&nbsp;
              Team size: <strong style={{ color:'var(--neon-cyan)' }}>{minSize}–{maxSize} players required</strong>
            </p>

            {/* Tabs */}
            <div className="team-option-tabs">
              {myTeams.length > 0 && (
                <button className={`tot ${teamOption==='existing'?'active':''}`}
                  onClick={() => setTeamOption('existing')}>
                  My Teams ({myTeams.length})
                </button>
              )}
              <button className={`tot ${teamOption==='create'?'active':''}`}
                onClick={() => setTeamOption('create')}>
                + Create Team
              </button>
              <button className={`tot ${teamOption==='join'?'active':''}`}
                onClick={() => setTeamOption('join')}>
                🔗 Join by Code
              </button>
            </div>

            {loadingTeams ? (
              <div style={{ textAlign:'center', padding:'30px 0' }}>
                <div className="loader" style={{ margin:'0 auto' }} />
              </div>
            ) : (
              <form onSubmit={registerWithTeam}>

                {/* ── Existing teams ── */}
                {teamOption === 'existing' && (
                  <div className="form-group">
                    <label className="form-label">Select Your Team</label>
                    {myTeams.map(t => {
                      const count   = t.members?.length || 0;
                      const tooFew  = count < minSize;
                      const tooMany = count > maxSize;
                      const sizeOk  = !tooFew && !tooMany;
                      return (
                        <div key={t._id}
                          className={`team-select-card ${selectedTeam===t._id?'selected':''} ${!sizeOk?'team-card-invalid':''}`}
                          onClick={() => setSelectedTeam(t._id)}>
                          <div className="tsc-radio">{selectedTeam===t._id?'●':'○'}</div>
                          <div className="tsc-info">
                            <strong>{t.name}</strong>
                            <span>{t.college}</span>
                          </div>
                          {/* Member count badge */}
                          <div className={`tsc-size ${sizeOk?'size-ok':'size-warn'}`}>
                            👥 {count} members
                            {tooFew  && <span> · Need {minSize - count} more</span>}
                            {tooMany && <span> · {count - maxSize} too many</span>}
                            {sizeOk  && <span> ✅</span>}
                          </div>
                        </div>
                      );
                    })}

                    {/* Warning if selected team size is invalid */}
                    {selectedTeamData && !teamSizeOk && (
                      <div className="size-warning-box">
                        ⚠️ Your team has <strong>{selectedMemberCount} member(s)</strong>.
                        This event requires <strong>{minSize}–{maxSize} players</strong>.
                        {selectedMemberCount < minSize
                          ? ` Add ${minSize - selectedMemberCount} more member(s) before registering.`
                          : ` Remove ${selectedMemberCount - maxSize} member(s) before registering.`}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Create new team ── */}
                {teamOption === 'create' && (
                  <div className="form-group">
                    <label className="form-label">Team Name *</label>
                    <input className="form-input"
                      value={newTeamName}
                      onChange={e => setNewTeamName(e.target.value)}
                      placeholder="e.g. Thunder Eagles"
                      required />
                    <div className="form-hint">
                      ⚠️ You'll become captain. You must recruit&nbsp;
                      <strong>{minSize - 1}–{maxSize - 1} more teammates</strong> using the join code before the team can be registered.
                    </div>
                  </div>
                )}

                {/* ── Join by code ── */}
                {teamOption === 'join' && (
                  <div className="form-group">
                    <label className="form-label">Join Code *</label>
                    <input className="form-input join-code-input"
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="AB1C2D"
                      maxLength={6} required />
                    <div className="form-hint">
                      Ask your team captain for the 6-character code. Once you join, only the captain can register the team.
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button type="button" className="btn btn-outline"
                    onClick={() => setShowTeamModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary"
                    disabled={registering || (teamOption === 'existing' && !teamSizeOk)}>
                    {registering ? 'Processing...' :
                      teamOption === 'create' ? '👑 Create Team' :
                      teamOption === 'join'   ? '🔗 Join Team'   :
                                               '✅ Register Team'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
