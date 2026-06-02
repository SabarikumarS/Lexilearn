import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AnimatedButton from '../components/AnimatedButton';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { getDyslexiaSeverity, SEVERITY_LABELS, SEVERITY_COLORS, getSortedConfusions } from '../services/dyslexiaEngine';

// ──────────────────────────────────────────────────────────────
// STAT CARD
// ──────────────────────────────────────────────────────────────
function StatCard({ emoji, label, value, color, bg, darkBg }) {
  const { isDark } = useTheme();
  return (
    <div style={{
      background: isDark ? (darkBg || `rgba(255,255,255,0.04)`) : bg,
      border: `1.5px solid ${color}30`,
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      textAlign: 'center',
      boxShadow: `0 4px 16px ${color}15`,
      flex: '1 1 140px',
      minWidth: '130px',
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{emoji}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 900, color, fontFamily: 'var(--font-secondary)' }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>{label}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// WEEKLY ACCURACY CHART (SVG bars)
// ──────────────────────────────────────────────────────────────
function AccuracyChart({ dailyAccuracy = [] }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const max  = Math.max(...dailyAccuracy, 10);
  const chartH = 80;

  return (
    <div>
      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
        📈 Weekly Accuracy
      </h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${chartH + 28}px` }}>
        {dailyAccuracy.map((val, i) => {
          const h    = Math.max(4, Math.round((val / max) * chartH));
          const isToday = i === new Date().getDay();
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 700, opacity: val > 0 ? 1 : 0 }}>
                {val > 0 ? `${val}%` : ''}
              </span>
              <div style={{
                width: '100%',
                height: `${h}px`,
                borderRadius: '6px 6px 0 0',
                background: isToday
                  ? 'linear-gradient(180deg, #4DAAFF, #7B6FFF)'
                  : val > 0 ? 'linear-gradient(180deg, #B07FFF60, #4DAAFF40)' : 'rgba(0,0,0,0.06)',
                transition: 'height 0.8s cubic-bezier(0.34,1.2,0.64,1)',
                boxShadow: isToday ? '0 4px 12px rgba(77,170,255,0.4)' : 'none',
              }} />
              <span style={{ fontSize: '0.7rem', color: isToday ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: isToday ? 800 : 500 }}>
                {days[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// CONFUSION HEATMAP
// ──────────────────────────────────────────────────────────────
function ConfusionHeatmap({ confusionHistory = {} }) {
  const sorted = getSortedConfusions(confusionHistory).slice(0, 12);

  if (!sorted.length) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
        🎉 No letter confusion detected yet! Keep practising.
      </div>
    );
  }

  const maxCount = sorted[0]?.count || 1;

  return (
    <div>
      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
        🔤 Letter Confusion Heatmap
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {sorted.map(({ pair, a, b, count }) => {
          const intensity = count / maxCount;
          const red   = Math.round(255 * intensity);
          const bg    = `rgba(${red}, ${Math.round(123 * (1 - intensity * 0.5))}, ${Math.round(123 * (1 - intensity))}, ${0.15 + intensity * 0.25})`;
          const border = `rgba(${red}, 80, 80, ${0.3 + intensity * 0.4})`;
          const textC = intensity > 0.6 ? '#c0392b' : '#7a4040';

          return (
            <div
              key={pair}
              className="heatmap-cell"
              title={`${count} confusion${count !== 1 ? 's' : ''}`}
              style={{
                background: bg,
                border: `1.5px solid ${border}`,
                borderRadius: '10px',
                padding: '8px 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                minWidth: '64px',
              }}
            >
              <span style={{ fontWeight: 900, fontSize: '1rem', color: textC, fontFamily: 'var(--font-secondary)' }}>
                {a.toUpperCase()} ↔ {b.toUpperCase()}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {count}×
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// LEVEL CHIPS
// ──────────────────────────────────────────────────────────────
function LevelChips({ readingLevel, speechLevel, gameLevel }) {
  const chips = [
    { label: '📖 Reading', level: readingLevel, color: '#4DAAFF' },
    { label: '🎤 Speech',  level: speechLevel,  color: '#5DD87A' },
    { label: '🎮 Games',   level: gameLevel,     color: '#FFD15E' },
  ];
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      {chips.map(({ label, level, color }) => (
        <div key={label} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '0.55rem 1.2rem',
          background: `${color}15`,
          border: `1.5px solid ${color}40`,
          borderRadius: 'var(--radius-full)',
          fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem',
          boxShadow: `0 2px 8px ${color}20`,
        }}>
          {label}
          <span style={{ color, fontWeight: 900, fontSize: '1rem' }}>Lv.{level}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {'⭐'.repeat(Math.min(level, 5))}
          </span>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN PROFILE PAGE
// ──────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const navigate               = useNavigate();
  const { user, signOut }      = useAuth();
  const { isDark }             = useTheme();
  // useProgress() provides Supabase-merged data (points + aggregated confusions)
  const { progress, confusionHistory } = useProgress();

  const displayName = user?.user_metadata?.full_name || user?.email || 'Guest Explorer';
  const email       = user?.email || '';

  // Initials + color
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const avatarColors = [
    ['#4DAAFF', '#7B6FFF'], ['#5DD87A', '#3ECFA8'],
    ['#B07FFF', '#FF7BCA'], ['#FFD15E', '#FF9A5E'], ['#FF7B7B', '#B07FFF'],
  ];
  const colorIdx = (initials.charCodeAt(0) || 0) % avatarColors.length;
  const [c1, c2] = avatarColors[colorIdx];

  const severity      = getDyslexiaSeverity(confusionHistory);
  const severityLabel = SEVERITY_LABELS[severity];
  const severityColor = SEVERITY_COLORS[severity];

  if (!progress) return null;

  const stats = [
    { emoji: '⭐', label: 'Total Points',   value: progress.totalPoints,      color: '#FF9A5E', bg: '#FFF2E8', darkBg: 'rgba(255,154,94,0.12)' },
    { emoji: '📚', label: 'Lessons Done',   value: progress.lessonsCompleted, color: '#4DAAFF', bg: '#EEF6FF', darkBg: 'rgba(77,170,255,0.12)' },
    { emoji: '🔥', label: 'Day Streak',     value: progress.streakDays,       color: '#FF7B7B', bg: '#FFF0F0', darkBg: 'rgba(255,123,123,0.12)' },
    { emoji: '🎯', label: 'Avg Accuracy',   value: `${progress.avgAccuracy}%`,color: '#5DD87A', bg: '#EDFFF5', darkBg: 'rgba(93,216,122,0.12)' },
    { emoji: '🧠', label: 'Dyslexia Acc.',  value: `${progress.avgDyslexiaAccuracy || 0}%`, color: '#B07FFF', bg: '#F4EEFF', darkBg: 'rgba(176,127,255,0.12)' },
  ];

  return (
    <div className="app-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background orbs */}
      <div className="bg-orb bg-orb-blue"   style={{ width:'400px', height:'400px', top:'-100px', left:'-100px' }} />
      <div className="bg-orb bg-orb-purple" style={{ width:'300px', height:'300px', bottom:'-80px', right:'-80px' }} />

      <Navbar user={user} onLogout={signOut} />

      <main style={{ flex: 1, padding: '2.5rem 2rem', maxWidth: '900px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>

        {/* Back button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <AnimatedButton variant="ghost" size="sm" onClick={() => navigate('/')}>⬅️ Home</AnimatedButton>
        </div>

        {/* ── Profile Header ── */}
        <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Large avatar */}
          <div style={{
            width: '90px', height: '90px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${c1}, ${c2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: '2rem',
            fontFamily: 'var(--font-secondary)',
            boxShadow: `0 8px 28px ${c1}50`,
            border: '3px solid rgba(255,255,255,0.7)',
            flexShrink: 0,
            animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}>
            {initials}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-secondary)', marginBottom: '0.2rem' }}>
              {displayName}
            </h1>
            {email && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>{email}</p>
            )}

            {/* Dyslexia severity badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '4px 16px',
              background: `${severityColor}18`,
              border: `1.5px solid ${severityColor}50`,
              borderRadius: 'var(--radius-full)',
              fontWeight: 700, fontSize: '0.88rem',
              color: severityColor,
            }}>
              🧠 Dyslexia Pattern: {severityLabel}
            </div>
          </div>

          {!user && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.6rem' }}>
                Sign in to save your progress
              </p>
              <AnimatedButton variant="primary" size="sm" onClick={() => navigate('/login')}>
                Sign In →
              </AnimatedButton>
            </div>
          )}
        </div>

        {/* ── Stats Row ── */}
        <div className="animate-slide-up" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', animationDelay: '0.1s' }}>
          {stats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        {/* ── Difficulty Levels ── */}
        <div className="glass-panel animate-slide-up" style={{ padding: '1.8rem', marginBottom: '2rem', animationDelay: '0.15s' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
            🚀 Difficulty Levels
          </h3>
          <LevelChips
            readingLevel={progress.readingLevel}
            speechLevel={progress.speechLevel}
            gameLevel={progress.gameLevel}
          />
        </div>

        {/* ── Weekly Accuracy Chart ── */}
        <div className="glass-panel animate-slide-up" style={{ padding: '1.8rem', marginBottom: '2rem', animationDelay: '0.2s' }}>
          <AccuracyChart dailyAccuracy={progress.dailyAccuracy} />
        </div>

        {/* ── Letter Confusion Heatmap ── */}
        <div className="glass-panel animate-slide-up" style={{ padding: '1.8rem', marginBottom: '2rem', animationDelay: '0.25s' }}>
          <ConfusionHeatmap confusionHistory={confusionHistory} />
        </div>

        {/* ── Logout ── */}
        {user && (
          <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
            <AnimatedButton variant="ghost" onClick={signOut}>🚪 Log Out</AnimatedButton>
          </div>
        )}
      </main>
    </div>
  );
}
