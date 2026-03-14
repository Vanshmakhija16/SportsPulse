import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './Events.css';

const SPORTS = ['All','Football','Cricket','Basketball','Volleyball','Tennis','Badminton','Chess','Athletics','Swimming','Kabaddi'];
const ICONS  = { Football:'🏈',Cricket:'🏏',Basketball:'🏀',Volleyball:'🏐',Tennis:'🎾',Badminton:'🏸',Chess:'♟️',Athletics:'🏃',Swimming:'🏊',Kabaddi:'🤸',default:'🏅' };

export default function Events() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search:'', status:'', sport:'', category:'' });

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.status)                     params.status   = filters.status;
    if (filters.sport && filters.sport !== 'All') params.sport = filters.sport;
    if (filters.category)                   params.category = filters.category;
    if (filters.search)                     params.search   = filters.search;
    api.get('/events', { params })
      .then(res => setEvents(res.data))
      .finally(() => setLoading(false));
  }, [filters]);

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div className="events-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">All <span className="neon-text">Events</span></h1>
            <p style={{ color:'var(--text-secondary)', marginTop:6 }}>Discover and register for sports events at your college</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <input className="form-input filter-search"
            placeholder="🔍  Search events..."
            value={filters.search}
            onChange={e => set('search', e.target.value)} />
          <select className="form-input filter-select" value={filters.status} onChange={e => set('status', e.target.value)}>
            <option value="">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
          <select className="form-input filter-select" value={filters.category} onChange={e => set('category', e.target.value)}>
            <option value="">All Types</option>
            <option value="individual">Individual</option>
            <option value="team">Team</option>
          </select>
        </div>

        {/* Sport Pills */}
        <div className="sport-pills">
          {SPORTS.map(s => (
            <button key={s}
              className={`sport-pill ${(filters.sport === s) || (!filters.sport && s === 'All') ? 'active' : ''}`}
              onClick={() => set('sport', s === 'All' ? '' : s)}>
              {ICONS[s] && <span>{ICONS[s]}</span>} {s}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
            <div className="loader" />
          </div>
        ) : events.length > 0 ? (
          <div className="event-list">
            {events.map(e => <EventRow key={e._id} event={e} />)}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🏟️</div>
            <h3>No events found</h3>
            <p>Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EventRow({ event }) {
  const icon     = ICONS[event.sport] || '🏅';
  const date     = new Date(event.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  const deadline = new Date(event.registrationDeadline).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
  const left     = (event.maxParticipants || 0) - (event.registrations?.length || 0);

  return (
    <Link to={`/events/${event._id}`} className="event-row">
      <div className="er-icon">{icon}</div>
      <div className="er-info">
        <div className="er-badges">
          <span className={`badge badge-${event.status}`}>{event.status}</span>
          <span className={`badge badge-${event.category}`}>{event.category}</span>
        </div>
        <h3 className="er-title">{event.title}</h3>
        <p  className="er-sport">{event.sport}</p>
        <div className="er-meta">
          <span>📅 {date}</span>
          <span>📍 {event.venue}</span>
          <span>⏰ Deadline: {deadline}</span>
          <span>👥 {left} spots left</span>
        </div>
      </div>
      {(event.prizes?.first || event.prizes?.second) && (
        <div className="er-prizes">
          {event.prizes?.first  && <div className="prize-tag"><span>🥇</span><small>{event.prizes.first}</small></div>}
          {event.prizes?.second && <div className="prize-tag"><span>🥈</span><small>{event.prizes.second}</small></div>}
        </div>
      )}
      <div className="er-arrow">›</div>
    </Link>
  );
}
