import { useState, useEffect } from 'react';
import api from '../utils/api';
import './Leaderboard.css';

export default function Leaderboard() {
  const [data,    setData]    = useState({ leaderboard: [], results: [] });
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState('colleges');

  useEffect(() => {
    api.get('/results/leaderboard')
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="leaderboard-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">🏆 <span className="neon-text">Leaderboard</span></h1>
            <p style={{ color:'var(--text-secondary)', marginTop:6 }}>College-wide rankings based on medals won across all events</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="lb-tabs">
          <button className={`lb-tab ${view==='colleges'?'active':''}`} onClick={() => setView('colleges')}>College Rankings</button>
          <button className={`lb-tab ${view==='results' ?'active':''}`} onClick={() => setView('results')}>All Results</button>
        </div>

        {view === 'colleges' ? (
          data.leaderboard.length > 0 ? (
            <div className="lb-table-wrap">
              {/* Top 3 podium */}
              {data.leaderboard.length >= 1 && (
                <div className="podium">
                  {data.leaderboard.slice(0,3).map((item, i) => (
                    <div key={item.college} className={`podium-item rank-${i+1}`}>
                      <div className="podium-medal">{i===0?'🥇':i===1?'🥈':'🥉'}</div>
                      <div className="podium-college">{item.college}</div>
                      <div className="podium-pts">{item.total} pts</div>
                      <div className="podium-block" />
                    </div>
                  ))}
                </div>
              )}
              <table className="table lb-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>College</th>
                    <th>🥇 Gold</th>
                    <th>🥈 Silver</th>
                    <th>🥉 Bronze</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leaderboard.map((item, i) => (
                    <tr key={item.college} className={i < 3 ? `top-rank top-${i+1}` : ''}>
                      <td>
                        <span className="rank-num">
                          {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                        </span>
                      </td>
                      <td><strong>{item.college}</strong></td>
                      <td className="cell-gold">{item.gold}</td>
                      <td className="cell-silver">{item.silver}</td>
                      <td className="cell-bronze">{item.bronze}</td>
                      <td><span className="pts-pill">{item.total} pts</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏅</div>
              <h3>No results yet</h3>
              <p>Results will appear once events are completed and medals are awarded</p>
            </div>
          )
        ) : (
          <div className="results-feed">
            {data.results.length > 0 ? data.results.map(r => (
              <div key={r._id} className="rf-item">
                <div className="rf-medal">
                  {r.medal==='gold'?'🥇':r.medal==='silver'?'🥈':r.medal==='bronze'?'🥉':`#${r.position}`}
                </div>
                <div className="rf-person">
                  <strong>{r.participant?.name || r.team?.name || 'Unknown'}</strong>
                  <span>{r.college}</span>
                </div>
                <div className="rf-event">
                  <strong>{r.event?.title}</strong>
                  <span>{r.event?.sport}</span>
                </div>
                {r.score && <div className="rf-score">{r.score}</div>}
              </div>
            )) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h3>No results recorded yet</h3>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
