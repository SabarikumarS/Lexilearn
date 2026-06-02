import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AnimatedButton from './AnimatedButton';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';

const navLinks = [
  { path: '/reading', label: '📖 Reading', color: '#4DAAFF' },
  { path: '/speech',  label: '🎤 Speech',  color: '#5DD87A' },
  { path: '/games',   label: '🎮 Games',   color: '#FFD15E' },
  { path: '/progress',label: '🏆 Progress',color: '#B07FFF' },
];

// ── Animated sun/moon toggle ──────────────────────────────────
function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    toggleTheme();
    setTimeout(() => setAnimating(false), 400);
  };

  return (
    <button
      className="theme-toggle"
      id="theme-toggle-btn"
      onClick={handleClick}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <span
        className={`theme-icon ${animating ? 'theme-icon-enter' : 'theme-icon-active'}`}
        style={{ lineHeight: 1 }}
      >
        {isDark ? '☀️' : '🌙'}
      </span>
    </button>
  );
}

// ── Main Navbar ───────────────────────────────────────────────
export default function Navbar({ user, onLogout }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isDark } = useTheme();
  const { totalPoints } = useProgress();

  // Derive initials from user's display name
  const displayName = user?.user_metadata?.full_name || user?.email || '';
  const initials = displayName
    ? displayName.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?';

  // Deterministic gradient based on initials
  const avatarColors = [
    ['#4DAAFF', '#7B6FFF'],
    ['#5DD87A', '#3ECFA8'],
    ['#B07FFF', '#FF7BCA'],
    ['#FFD15E', '#FF9A5E'],
    ['#FF7B7B', '#B07FFF'],
  ];
  const colorIdx = initials.charCodeAt(0) % avatarColors.length || 0;
  const [c1, c2] = avatarColors[colorIdx];

  // Dark-aware inline values (CSS class override handles the background,
  // but border/shadow need JS because they're inline)
  const navBg = isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.92)';
  const navBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.7)';
  const ptsBadgeColor = isDark ? '#ffd97a' : '#5a3a00';
  const ptsBadgeBorder = isDark ? 'rgba(255,217,122,0.4)' : '#FFD15E80';

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.85rem 2rem',
      background: navBg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: isDark ? '0 2px 20px rgba(0,0,0,0.4)' : '0 2px 20px rgba(77,170,255,0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: `1.5px solid ${navBorder}`,
      flexWrap: 'wrap',
      gap: '0.5rem',
      transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
    }}>
      {/* ── Logo ── */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{
          width: '44px', height: '44px',
          background: 'linear-gradient(135deg, #4DAAFF, #7B6FFF)',
          borderRadius: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 900, fontSize: '1.4rem',
          boxShadow: '0 4px 16px rgba(77,170,255,0.45)',
          transition: 'transform 0.2s ease',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'rotate(-5deg) scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0) scale(1)'}
        >📚</div>
        <span style={{
          fontFamily: 'var(--font-secondary)',
          fontSize: '1.6rem',
          fontWeight: 900,
          color: 'var(--text-main)',
          letterSpacing: '-0.5px',
        }}>
          Lexi<span style={{
            background: 'linear-gradient(135deg, #4DAAFF, #7B6FFF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Learn</span>
        </span>
      </Link>

      {/* ── Nav Links ── */}
      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
        {navLinks.map(link => {
          const isActive = location.pathname === link.path;
          return (
            <Link key={link.path} to={link.path} style={{
              padding: '0.5rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              fontFamily: 'var(--font-primary)',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: isActive ? 'white' : 'var(--text-muted)',
              background: isActive ? `linear-gradient(135deg, ${link.color}, ${link.color}cc)` : 'transparent',
              transition: 'all 0.25s ease',
              whiteSpace: 'nowrap',
              boxShadow: isActive ? `0 4px 12px ${link.color}40` : 'none',
            }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = `${link.color}22`; e.currentTarget.style.color = link.color; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* ── Right section: theme toggle + auth ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {/* Theme toggle */}
        <ThemeToggle />

        {user ? (
          <>
            {/* Points badge */}
            <div className="points-badge" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '5px 12px',
              background: isDark ? 'rgba(255,217,122,0.1)' : 'linear-gradient(135deg, #FFD15E20, #FF9A5E20)',
              borderRadius: 'var(--radius-full)',
              border: `1.5px solid ${ptsBadgeBorder}`,
              fontWeight: 700, fontSize: '0.9rem',
              color: ptsBadgeColor,
              transition: 'all 0.3s ease',
            }}>
              ⭐ {totalPoints} pts
            </div>

            {/* Profile avatar */}
            <div
              className="profile-avatar"
              id="navbar-profile-avatar"
              title={`${displayName} — View Profile`}
              onClick={() => navigate('/profile')}
              style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
              role="button"
              aria-label="Go to profile"
            >
              {initials}
            </div>

            <AnimatedButton variant="ghost" size="sm" onClick={onLogout}>Logout</AnimatedButton>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '0.55rem 1.5rem',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #4DAAFF, #7B6FFF)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.95rem',
              fontFamily: 'var(--font-primary)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(77,170,255,0.4)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(77,170,255,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(77,170,255,0.4)'; }}
          >
            Log In ✨
          </button>
        )}
      </div>
    </nav>
  );
}