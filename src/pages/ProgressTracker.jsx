import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import AnimatedButton from '../components/AnimatedButton';
import { fetchAttemptsFromSupabase } from '../services/progressService';
import { getSortedConfusions, SEVERITY_LABELS, SEVERITY_COLORS, getDyslexiaSeverity } from '../services/dyslexiaEngine';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const ALL_BADGES = [
  { icon:'🌟', title:'First Steps',    color:'#4DAAFF', req:'Complete 1 lesson' },
  { icon:'🔥', title:'High Scorer',    color:'#FF7B7B', req:'Earn 50 points' },
  { icon:'🧠', title:'Word Wizard',    color:'#B07FFF', req:'80% avg (3 lessons)' },
  { icon:'💬', title:'Voice Champion', color:'#5DD87A', req:'5 speech sessions' },
  { icon:'📖', title:'Reading Star',   color:'#FFD15E', req:'5 reading sessions' },
  { icon:'🏆', title:'Star Learner',   color:'#FF9A5E', req:'Earn 200 points' },
  { icon:'🔥', title:'3-Day Streak',   color:'#FF4444', req:'3 days in a row' },
  { icon:'⚔️', title:'Week Warrior',   color:'#3ECFA8', req:'7-day streak' },
];

function StatCard({ emoji, label, value, color, bg, darkBg }) {
  const { isDark } = useTheme();
  return (
    <div style={{
      background: isDark ? (darkBg || `rgba(255,255,255,0.04)`) : (bg || '#f9fafb'),
      border:`2px solid ${color}40`,
      borderRadius:'var(--radius-lg)',
      padding:'1.8rem 1.5rem',
      textAlign:'center',
      boxShadow:'var(--shadow-sm)',
      display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem'
    }}>
      <div style={{ fontSize:'2.5rem' }}>{emoji}</div>
      <div style={{ fontSize:'2.4rem', fontWeight:900, color, fontFamily:'var(--font-secondary)' }}>{value}</div>
      <div style={{ fontSize:'0.95rem', color:'var(--text-muted)', fontWeight:600 }}>{label}</div>
    </div>
  );
}

function AnimatedBar({ label, value, color }) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem', fontWeight:600 }}>
        <span style={{ color:'var(--text-main)', fontSize:'1rem' }}>{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{
          background:`linear-gradient(90deg, ${color}, ${color}cc)`,
          width:`${value}%`,
          transition:'width 1.5s ease'
        }} />
      </div>
    </div>
  );
}

export default function ProgressTracker() {
  const navigate = useNavigate();
  const { user, isGuest, signOut } = useAuth();
  const { isDark } = useTheme();
  // useProgress() gives us merged local+cloud data (same source as Dashboard + Navbar)
  const { progress: ctxProgress, confusionHistory } = useProgress();
  const [attempts,   setAttempts]   = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchAttemptsFromSupabase(user.id, 20).then(rows => {
        if (rows?.length) setAttempts(rows);
      });
    }
  }, [user]);

  // Use context data directly (already merges localStorage + Supabase)
  const display = ctxProgress || {};

  // Keep cloudData indicator
  const [lastSync, setLastSync] = useState(null);
  useEffect(() => { if (!isGuest) setLastSync(new Date()); }, [isGuest]);

  if (!display || !display.totalPoints === undefined) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>Loading…</div>;

  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const pronAvg = display.pronunciationScores?.length
    ? Math.round(display.pronunciationScores.reduce((a,b)=>a+b,0) / display.pronunciationScores.length)
    : 0;

  // Accuracy breakdown from Supabase attempts (logged-in only)
  const speechAttempts  = attempts.filter(a => a.type === 'speech');
  const avgSpeechAcc    = speechAttempts.length ? Math.round(speechAttempts.reduce((s,a)=>s+(a.accuracy??0),0)/speechAttempts.length) : null;
  const avgCorrectness  = speechAttempts.length ? Math.round(speechAttempts.reduce((s,a)=>s+(a.correctness??0),0)/speechAttempts.length) : null;

  const lineData = {
    labels: days,
    datasets: [{
      label:'Accuracy %',
      data: display.dailyAccuracy || [0,0,0,0,0,0,0],
      borderColor:'#4DAAFF',
      backgroundColor:'rgba(77,170,255,0.15)',
      tension:0.45,
      fill: true,
      pointBackgroundColor:'#4DAAFF',
      pointRadius:5
    }]
  };
  const barData = {
    labels: days,
    datasets: [{
      label:'Minutes',
      data: display.dailyTime || [0,0,0,0,0,0,0],
      backgroundColor:'rgba(255,209,94,0.75)',
      borderRadius:8,
      hoverBackgroundColor:'#FFD15E'
    }]
  };
  const chartOpts = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ min:0, ticks:{ color:'#718096' } }, x:{ ticks:{ color:'#718096' } } } };
  const lineOpts  = { ...chartOpts, scales:{ ...chartOpts.scales, y:{ ...chartOpts.scales.y, max:100 } } };

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={signOut} />

      <main style={{ flex:1, padding:'2rem', maxWidth:'1200px', margin:'0 auto', width:'100%', display:'flex', flexDirection:'column', gap:'2rem' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center' }}>
          <AnimatedButton variant="ghost" size="sm" onClick={() => navigate('/')}>⬅️ Home</AnimatedButton>
          <h1 style={{ flex:1, textAlign:'center', fontSize:'2.2rem', background:'linear-gradient(135deg,#B07FFF,#4DAAFF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            My Progress 🏆
          </h1>
          <div style={{ width:'100px' }} />
        </div>

        {/* Guest banner */}
        {isGuest && (
          <div style={{
            padding:'1rem 1.5rem', borderRadius:'var(--radius-md)',
            background:'linear-gradient(135deg, rgba(77,170,255,0.12), rgba(176,127,255,0.12))',
            border:'1.5px solid rgba(77,170,255,0.35)',
            display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap'
          }}>
            <span style={{ fontSize:'1.8rem' }}>👤</span>
            <div style={{ flex:1 }}>
              <strong style={{ color:'var(--color-primary)' }}>You're in Guest Mode</strong>
              <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', margin:'0.2rem 0 0' }}>
                Your progress is only stored on this device.{' '}
                <span onClick={() => navigate('/login')} style={{ color:'var(--color-primary)', cursor:'pointer', fontWeight:700 }}>
                  Sign in to save it to the cloud →
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Cloud sync indicator */}
        {!isGuest && lastSync && (
          <div style={{ textAlign:'right', fontSize:'0.82rem', color:'var(--text-muted)', fontWeight:600 }}>
            ☁️ Synced · {lastSync.toLocaleTimeString()}
          </div>
        )}

        {/* Streak Banner */}
        {(display.streakDays || 0) > 0 && (
          <div style={{
            background:'linear-gradient(135deg, #FF9A5E, #FF7B7B)',
            borderRadius:'var(--radius-lg)', padding:'1.2rem 2rem',
            display:'flex', alignItems:'center', gap:'1rem', boxShadow:'var(--shadow-md)'
          }}>
            <span style={{ fontSize:'2.5rem', animation:'bounce 1s ease-in-out infinite' }}>🔥</span>
            <div>
              <div style={{ color:'white', fontWeight:800, fontSize:'1.2rem' }}>
                {display.streakDays} Day Learning Streak!
              </div>
              <div style={{ color:'rgba(255,255,255,0.85)', fontSize:'0.95rem' }}>
                Keep it up — you're on a roll!
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'1.25rem' }}>
          <StatCard emoji="⭐" label="Total Points"      value={display.totalPoints || 0}     color="#FFD15E" bg="#FFFBED" darkBg="rgba(255,209,94,0.12)" />
          <StatCard emoji="📚" label="Lessons Done"      value={display.lessonsCompleted||0}   color="#4DAAFF" bg="#EEF6FF" darkBg="rgba(77,170,255,0.12)" />
          <StatCard emoji="🎯" label="Avg Accuracy"      value={`${display.avgAccuracy||0}%`}  color="#5DD87A" bg="#EDFFF5" darkBg="rgba(93,216,122,0.12)" />
          <StatCard emoji="💬" label="Speech Avg"        value={`${pronAvg}%`}                 color="#B07FFF" bg="#F4EEFF" darkBg="rgba(176,127,255,0.12)" />
          <StatCard emoji="⏱️" label="Minutes Practised" value={display.timeSpent||0}          color="#FF9A5E" bg="#FFF2E8" darkBg="rgba(255,154,94,0.12)" />
        </div>

        {/* Skill Progress Bars */}
        <div className="glass-panel" style={{ padding:'2rem' }}>
          <h3 style={{ fontSize:'1.6rem', marginBottom:'1.5rem', color:'var(--text-main)' }}>Skill Levels</h3>
          <AnimatedBar label="📖 Reading"     value={Math.min(100, (display.readingLevel || 1) * 20)} color="#4DAAFF" />
          <AnimatedBar label="🎤 Speech"      value={Math.min(100, (display.speechLevel  || 1) * 20)} color="#5DD87A" />
          <AnimatedBar label="🎮 Games"       value={Math.min(100, (display.gameLevel    || 1) * 20)} color="#FFD15E" />
          <AnimatedBar label="🎯 Avg Accuracy" value={display.avgAccuracy || 0}                        color="#B07FFF" />
        </div>

        {/* Speech Accuracy Breakdown (from Supabase, logged-in only) */}
        {!isGuest && speechAttempts.length > 0 && (
          <div className="glass-panel" style={{ padding:'2rem' }}>
            <h3 style={{ fontSize:'1.4rem', marginBottom:'1.5rem', color:'var(--text-main)' }}>🎤 Speech Score Breakdown</h3>
            {avgSpeechAcc !== null   && <AnimatedBar label="🎯 Accuracy (character-level)"   value={avgSpeechAcc}   color="#4DAAFF" />}
            {avgCorrectness !== null && <AnimatedBar label="✅ Correctness (word-level)"       value={avgCorrectness} color="#B07FFF" />}
            <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginTop:'0.5rem' }}>
              Based on your last {speechAttempts.length} speech attempt{speechAttempts.length !== 1 ? 's' : ''} from cloud.
            </p>
          </div>
        )}

        {/* Charts */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(380px, 1fr))', gap:'2rem' }}>
          <div className="glass-panel" style={{ padding:'2rem' }}>
            <h3 style={{ marginBottom:'1rem', color:'var(--text-main)', textAlign:'center', fontSize:'1.2rem' }}>📈 Daily Accuracy</h3>
            <div style={{ height:'240px' }}><Line options={lineOpts} data={lineData} /></div>
          </div>
          <div className="glass-panel" style={{ padding:'2rem' }}>
            <h3 style={{ marginBottom:'1rem', color:'var(--text-main)', textAlign:'center', fontSize:'1.2rem' }}>⏱️ Time Spent (Minutes)</h3>
            <div style={{ height:'240px' }}><Bar options={chartOpts} data={barData} /></div>
          </div>
        </div>

        {/* Badges */}
        <div className="glass-panel" style={{ padding:'2rem' }}>
          <h3 style={{ fontSize:'1.6rem', marginBottom:'1.5rem', color:'var(--text-main)' }}>🏅 Badges & Achievements</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'1.5rem' }}>
            {ALL_BADGES.map(badge => {
              const earned = display.badges?.includes(badge.title);
              return (
                <div key={badge.title} style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem',
                  opacity: earned ? 1 : 0.45,
                  filter: earned ? 'none' : 'grayscale(100%)',
                  transition:'all 0.3s'
                }}>
                  <div style={{
                    width:'76px', height:'76px', borderRadius:'50%',
                    background: earned ? `linear-gradient(135deg, ${badge.color}40, ${badge.color}20)` : 'rgba(0,0,0,0.06)',
                    border:`2.5px solid ${earned ? badge.color : 'transparent'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'2.2rem', boxShadow: earned ? `0 6px 20px ${badge.color}40` : 'none',
                    animation: earned ? 'float 3s ease-in-out infinite' : 'none'
                  }}>
                    {badge.icon}
                  </div>
                  <div style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text-main)', textAlign:'center' }}>{badge.title}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', textAlign:'center' }}>{badge.req}</div>
                  {earned && <div style={{ fontSize:'0.8rem', color:badge.color, fontWeight:700 }}>✅ Earned!</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dyslexia Patterns Panel */}
        {(() => {
          const sortedPairs = getSortedConfusions(confusionHistory || {});
          const severity    = getDyslexiaSeverity(confusionHistory || {});
          const sevLabel    = SEVERITY_LABELS[severity];
          const sevColor    = SEVERITY_COLORS[severity];
          return (
            <div className="glass-panel" style={{ padding:'2rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.2rem', flexWrap:'wrap' }}>
                <h3 style={{ fontSize:'1.4rem', color:'var(--text-main)', margin:0 }}>🧠 Dyslexia Patterns</h3>
                <span style={{
                  padding:'3px 14px', borderRadius:'var(--radius-full)',
                  background:`${sevColor}18`, border:`1.5px solid ${sevColor}50`,
                  color:sevColor, fontWeight:700, fontSize:'0.85rem'
                }}>{sevLabel}</span>
              </div>
              {sortedPairs.length === 0 ? (
                !user ? (
                  <p style={{ color:'var(--text-muted)', fontSize:'0.92rem' }}>Sign in and complete exercises to see your dyslexia patterns.</p>
                ) : attempts.length === 0 ? (
                  <p style={{ color:'var(--text-muted)', fontSize:'0.92rem' }}>No data yet — complete a few exercises to start tracking patterns.</p>
                ) : (
                  <p style={{ color:'var(--text-muted)', fontSize:'0.92rem' }}>🎉 No letter confusions detected! Keep practising.</p>
                )
              ) : (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem' }}>
                  {sortedPairs.slice(0, 8).map(({ pair, a, b, count }) => {
                    const intensity = Math.min(count / (sortedPairs[0]?.count || 1), 1);
                    const label = count >= 5 ? 'Frequent' : count >= 2 ? 'Moderate' : 'Occasional';
                    const badgeColor = count >= 5 ? '#FF7B7B' : count >= 2 ? '#FF9A5E' : '#FFD15E';
                    return (
                      <div key={pair} style={{
                        padding:'0.6rem 1.2rem',
                        borderRadius:'var(--radius-full)',
                        background:`${badgeColor}15`,
                        border:`1.5px solid ${badgeColor}50`,
                        display:'flex', alignItems:'center', gap:'8px',
                      }}>
                        <span style={{ fontWeight:800, fontSize:'1rem', color:badgeColor, fontFamily:'var(--font-secondary)' }}>
                          {a.toUpperCase()} ↔ {b.toUpperCase()}
                        </span>
                        <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600 }}>
                          {label} · {count}×
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Recent Activity */}
        {((!isGuest && attempts.length > 0) || display.activityHistory?.length > 0) && (
          <div className="glass-panel" style={{ padding:'2rem' }}>
            <h3 style={{ fontSize:'1.6rem', marginBottom:'1rem', color:'var(--text-main)' }}>📋 Recent Activity</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {(!isGuest && attempts.length > 0
                ? attempts.slice(0, 5)
                : [...(display.activityHistory||[])].reverse().slice(0, 5).map(act => ({
                    type: act.type, score: act.score || act.accuracy || 0, created_at: act.ts
                  }))
              ).map((act, i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:'1rem',
                  padding:'0.75rem 1.25rem', borderRadius:'var(--radius-md)',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  border: isDark ? '1.5px solid rgba(255,255,255,0.08)' : '1.5px solid rgba(0,0,0,0.05)'
                }}>
                  <span style={{ fontSize:'1.5rem' }}>
                    {act.type === 'speech' ? '🎤' : act.type === 'reading' ? '📖' : '🎮'}
                  </span>
                  <span style={{ fontWeight:600, color:'var(--text-main)', flex:1 }}>
                    {act.type === 'speech' ? 'Speech Practice' : act.type === 'reading' ? 'Reading Practice' : 'Learning Game'}
                  </span>
                  <span style={{ fontWeight:700, color:'#FFD15E' }}>
                    {Math.round(act.score ?? act.accuracy ?? 0)}%
                  </span>
                  {act.created_at && (
                    <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>
                      {new Date(act.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}