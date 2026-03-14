import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './Home.css';

const ICONS = {
  Football:'🏈', Cricket:'🏏', Basketball:'🏀', Volleyball:'🏐',
  Tennis:'🎾', Badminton:'🏸', Chess:'♟️', Athletics:'🏃',
  Swimming:'🏊', Kabaddi:'🤸', default:'🏅'
};

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events?status=upcoming')
      .then(res => setEvents(res.data.slice(0, 3)))
      .finally(() => setLoading(false));
  }, []);

  const tickerSports = [
    'Football','Cricket','Basketball','Volleyball','Tennis',
    'Badminton','Chess','Athletics','Swimming','Kabaddi',
    'Football','Cricket','Basketball','Volleyball','Tennis',
    'Badminton','Chess','Athletics','Swimming','Kabaddi',
  ];

  return (
    <div className="home">

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="container hero-content fade-in">
          <div className="hero-badge">🏆 &nbsp;College Sports Management Platform</div>
          <h1 className="hero-title">
            WHERE ATHLETES<br />
            <span className="neon-text">BECOME</span> LEGENDS
          </h1>
          <p className="hero-sub">
            Discover, register &amp; compete in college sports events.
            Track live results, form teams, and climb the leaderboard.
          </p>
          <div className="hero-btns">
            <Link to="/events"   className="btn btn-primary btn-lg">Browse Events</Link>
            <Link to="/register" className="btn btn-outline btn-lg">Join Free →</Link>
          </div>
          <div className="hero-stats">
            <div className="hstat"><span className="hstat-num">{events.length}+</span><small>Live Events</small></div>
            <div className="hstat-divider" />
            <div className="hstat"><span className="hstat-num">500+</span><small>Athletes</small></div>
            <div className="hstat-divider" />
            <div className="hstat"><span className="hstat-num">20+</span><small>Sports</small></div>
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="ticker">
        <div className="ticker-track">
          {tickerSports.map((s, i) => (
            <span key={i}>{ICONS[s] || '🏅'}&nbsp;{s}</span>
          ))}
        </div>
      </div>

      {/* ── Featured Events ── */}
      <section className="section container">
        <div className="section-header">
          <div>
            <div className="section-tag">UPCOMING</div>
            <h2 className="section-title">Featured Events</h2>
          </div>
          <Link to="/events" className="btn btn-outline btn-sm">View All →</Link>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
            <div className="loader" />
          </div>
        ) : events.length > 0 ? (
          <div className="events-grid">
            {events.map(e => <EventCard key={e._id} event={e} />)}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🏟️</div>
            <h3>No upcoming events yet</h3>
            <p>Check back soon!</p>
          </div>
        )}
      </section>

      {/* ── Features ── */}
      <section className="features-section">
        <div className="container">
          <div className="section-tag" style={{ textAlign:'center', marginBottom:8 }}>HOW IT WORKS</div>
          <h2 className="section-title" style={{ textAlign:'center', marginBottom:48 }}>Everything You Need</h2>
          <div className="grid-4">
            {[
              { icon:'📋', title:'Register Events',  desc:'Browse and register for sports events happening across your college — individual or team.' },
              { icon:'👥', title:'Form Teams',        desc:'Create a team, share your join code with friends, and compete together.' },
              { icon:'🏆', title:'Track Results',     desc:'Live results and standings updated in real-time after every event.' },
              { icon:'📊', title:'Leaderboards',      desc:'College-wide rankings showing top performers across all sports.' },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section container">
        <div className="cta-card">
          <h2>Ready to Compete?</h2>
          <p>Join thousands of college athletes on SportsPulse today</p>
          <div className="hero-btns" style={{ justifyContent:'center' }}>
            <Link to="/register"    className="btn btn-primary btn-lg">Get Started Free</Link>
            <Link to="/leaderboard" className="btn btn-outline btn-lg">View Leaderboard</Link>
          </div>
        </div>
      </section>

    </div>
  );
}

function EventCard({ event }) {
  const icon = ICONS[event.sport] || '🏅';
  const date = new Date(event.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  const total  = event.maxParticipants || 1;
  const filled = event.registrations?.length || 0;
  const left   = total - filled;

  return (
    <Link to={`/events/${event._id}`} className="event-card">
      <div className="ec-top">
        <span className="ec-sport-icon">{icon}</span>
        <span className={`badge badge-${event.status}`}>{event.status}</span>
      </div>
      <div className="ec-body">
        <span className={`badge badge-${event.category}`} style={{ marginBottom:8 }}>{event.category}</span>
        <h3 className="ec-title">{event.title}</h3>
        <p  className="ec-sport">{event.sport}</p>
        <div className="ec-meta">
          <span>📅 {date}</span>
          <span>📍 {event.venue}</span>
        </div>
        <div className="ec-footer">
          <div className="spots-bar" style={{ marginBottom:4 }}>
            <div className="spots-fill" style={{ width:`${Math.min(100, (filled/total)*100)}%` }} />
          </div>
          <small style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>{left} spots left</small>
        </div>
      </div>
    </Link>
  );
}
