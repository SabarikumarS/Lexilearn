/**
 * LearningPath.jsx
 * ─────────────────────────────────────────────────────────────────────
 * Personalized learning roadmap page.
 * Shows skill level, weak areas, recommended sequence of activities,
 * XP progress, and badges earned.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAssessment } from '../context/AssessmentContext';
import { SECTION_LABELS, SKILL_LEVEL_CONFIG, SECTION_SCORE_LABEL } from '../services/assessmentService';

// ─────────────────────────────────────────────────────────────────────
// SKILL LEVEL BADGE
// ─────────────────────────────────────────────────────────────────────

function SkillBadge({ skillLevel }) {
  const cfg = SKILL_LEVEL_CONFIG[skillLevel] || SKILL_LEVEL_CONFIG.beginner;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '10px',
      padding: '0.75rem 1.8rem',
      background: cfg.bgColor,
      border: `2px solid ${cfg.borderColor}`,
      borderRadius: '999px',
      boxShadow: `0 6px 24px ${cfg.color}30`,
    }}>
      <span style={{ fontSize: '1.8rem' }}>{cfg.emoji}</span>
      <div>
        <div style={{ fontWeight: 900, fontSize: '1.2rem', color: cfg.color, fontFamily: 'var(--font-secondary)' }}>
          {cfg.label}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Skill Level
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// XP BAR
// ─────────────────────────────────────────────────────────────────────

function XPBar({ xp }) {
  const XP_PER_LEVEL = 200;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const progress = ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;

  return (
    <div style={{
      background: 'rgba(255,209,94,0.08)',
      border: '1.5px solid rgba(255,209,94,0.3)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.2rem 1.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.3rem' }}>⚡</span>
          <span style={{ fontWeight: 800, color: '#FFD15E', fontSize: '1rem' }}>
            Level {level}
          </span>
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          {xp} XP · {XP_PER_LEVEL - (xp % XP_PER_LEVEL)} XP to next level
        </span>
      </div>
      <div style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '999px', height: '10px' }}>
        <div style={{
          width: `${progress}%`, height: '100%', borderRadius: '999px',
          background: 'linear-gradient(90deg, #FFD15E, #FF9A5E)',
          transition: 'width 1s cubic-bezier(0.34,1.2,0.64,1)',
          boxShadow: '0 2px 8px rgba(255,209,94,0.4)',
        }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// BADGE DISPLAY
// ─────────────────────────────────────────────────────────────────────

function BadgeGrid({ badges }) {
  const defaultBadges = [
    { id: 'first_assessment', label: 'Assessment Complete', icon: '🎯', earned: true },
    { id: 'first_lesson',     label: 'First Lesson',        icon: '📚', earned: false },
    { id: 'streak_3',         label: '3-Day Streak',        icon: '🔥', earned: false },
    { id: 'accuracy_star',    label: 'Accuracy Star',       icon: '⭐', earned: false },
    { id: 'xp_hero',          label: 'XP Hero',             icon: '🏅', earned: false },
    { id: 'voice_champion',   label: 'Voice Champion',      icon: '🎤', earned: false },
  ];

  const earned = new Set(badges || []);
  const allBadges = defaultBadges.map(b => ({
    ...b,
    earned: b.id === 'first_assessment' || earned.has(b.label),
  }));

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
      {allBadges.map(badge => (
        <div
          key={badge.id}
          title={badge.label}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            padding: '0.8rem 1rem',
            background: badge.earned
              ? 'linear-gradient(135deg, rgba(255,209,94,0.15), rgba(255,154,94,0.12))'
              : 'rgba(0,0,0,0.05)',
            border: badge.earned ? '1.5px solid rgba(255,209,94,0.4)' : '1.5px solid rgba(0,0,0,0.1)',
            borderRadius: 'var(--radius-md)',
            opacity: badge.earned ? 1 : 0.45,
            filter: badge.earned ? 'none' : 'grayscale(1)',
            minWidth: '80px',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '1.8rem' }}>{badge.icon}</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>
            {badge.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// LEARNING PATH CARD
// ─────────────────────────────────────────────────────────────────────

function PathCard({ item, index, isFirst, onClick }) {
  const pColor = item.priority === 'high' ? '#FF7B7B' : item.priority === 'medium' ? '#FFD15E' : '#5DD87A';
  const { label: scoreLabel, color: scoreColor } = SECTION_SCORE_LABEL(item.score || 0);

  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      {/* Connector line + number */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: isFirst
            ? 'linear-gradient(135deg, #4DAAFF, #B07FFF)'
            : `linear-gradient(135deg, ${pColor}60, ${pColor}30)`,
          border: `2.5px solid ${isFirst ? '#4DAAFF' : pColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem', fontWeight: 900,
          boxShadow: isFirst ? '0 6px 20px rgba(77,170,255,0.4)' : `0 4px 12px ${pColor}30`,
          color: 'white',
          animation: isFirst ? 'pulse 2s ease infinite' : 'none',
        }}>
          {item.icon}
        </div>
        {index < 4 && (
          <div style={{ width: '2px', height: '28px', background: `linear-gradient(180deg, ${pColor}40, transparent)`, margin: '4px 0' }} />
        )}
      </div>

      {/* Card */}
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          flex: 1,
          padding: '1.2rem 1.5rem',
          background: isFirst
            ? 'linear-gradient(135deg, rgba(77,170,255,0.1), rgba(176,127,255,0.08))'
            : hovered ? `${pColor}08` : 'var(--card-bg)',
          border: isFirst
            ? '2px solid rgba(77,170,255,0.35)'
            : `1.5px solid ${hovered ? pColor : pColor + '30'}`,
          borderRadius: 'var(--radius-lg)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered ? `0 8px 24px ${pColor}25` : 'none',
          marginBottom: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{item.label}</span>
              {isFirst && (
                <span style={{
                  background: 'linear-gradient(135deg, #4DAAFF, #B07FFF)',
                  color: 'white', borderRadius: '999px',
                  padding: '1px 10px', fontSize: '0.7rem', fontWeight: 800,
                  letterSpacing: '0.5px',
                }}>
                  START HERE
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.75rem', fontWeight: 700, color: pColor,
                background: `${pColor}15`, borderRadius: '999px',
                padding: '1px 8px', textTransform: 'capitalize',
              }}>
                {item.priority} priority
              </span>
              {item.score !== undefined && (
                <span style={{
                  fontSize: '0.75rem', fontWeight: 700, color: scoreColor,
                  background: `${scoreColor}15`, borderRadius: '999px',
                  padding: '1px 8px',
                }}>
                  {item.score}% · {scoreLabel}
                </span>
              )}
            </div>
          </div>

          {/* Score donut */}
          <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="19" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="4" />
              <circle
                cx="24" cy="24" r="19" fill="none"
                stroke={pColor} strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 19}`}
                strokeDashoffset={`${2 * Math.PI * 19 * (1 - (item.score || 0) / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 24 24)"
              />
            </svg>
            <span style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              fontSize: '0.72rem', fontWeight: 900, color: pColor,
            }}>
              {item.score || 0}%
            </span>
          </div>
        </div>

        {isFirst && (
          <div style={{
            marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '0.82rem', color: '#4DAAFF', fontWeight: 600,
          }}>
            <span>👆 Tap to begin</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// WEAK AREAS PANEL
// ─────────────────────────────────────────────────────────────────────

function WeakAreaPanel({ weakAreas }) {
  if (!weakAreas?.length) return null;
  return (
    <div style={{
      background: 'rgba(255,123,123,0.07)',
      border: '1.5px solid rgba(255,123,123,0.25)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.3rem 1.5rem',
    }}>
      <h4 style={{ fontWeight: 800, color: '#FF7B7B', marginBottom: '0.8rem', fontSize: '0.95rem' }}>
        🎯 Focus Areas — needs more practice
      </h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
        {weakAreas.map(area => (
          <span key={area} style={{
            background: 'rgba(255,123,123,0.12)',
            border: '1px solid rgba(255,123,123,0.3)',
            borderRadius: '999px', padding: '4px 14px',
            fontSize: '0.85rem', fontWeight: 700, color: '#c0392b',
          }}>
            {SECTION_LABELS[area]?.replace(/[🔤🔊📝📖🧠]\s/, '') || area}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────

export default function LearningPath() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isDark } = useTheme();
  const {
    userProfile, skillLevel, skillConfig,
    learningPath, weakAreas, xp, badges,
    assessmentDone,
  } = useAssessment();

  // If no assessment done yet, prompt
  if (!assessmentDone) {
    return (
      <div className="app-container">
        <Navbar user={user} onLogout={signOut} />
        <main style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem',
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '480px', width: '100%', padding: '3rem 2.5rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.2rem' }}>🗺️</div>
            <h2 style={{ fontFamily: 'var(--font-secondary)', fontSize: '1.8rem', marginBottom: '0.8rem' }}>
              No Learning Path Yet
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Complete the pre-assessment to get your personalized learning roadmap!
            </p>
            <button
              onClick={() => navigate('/assessment')}
              style={{
                padding: '0.9rem 2.5rem',
                background: 'linear-gradient(135deg, #4DAAFF, #B07FFF)',
                color: 'white', border: 'none', borderRadius: 'var(--radius-full)',
                fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(77,170,255,0.4)',
                fontFamily: 'var(--font-primary)',
              }}
            >
              Take Assessment 🎯
            </button>
          </div>
        </main>
      </div>
    );
  }

  const cfg = skillConfig || SKILL_LEVEL_CONFIG[skillLevel] || SKILL_LEVEL_CONFIG.beginner;

  return (
    <div className="app-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background orbs */}
      <div className="bg-orb bg-orb-blue"   style={{ width: '450px', height: '450px', top: '-150px', left: '-150px' }} />
      <div className="bg-orb bg-orb-purple" style={{ width: '350px', height: '350px', bottom: '-80px', right: '-80px' }} />

      <Navbar user={user} onLogout={signOut} />

      <main style={{
        flex: 1, padding: '2.5rem 2rem 5rem',
        maxWidth: '800px', margin: '0 auto', width: '100%',
        position: 'relative', zIndex: 1,
      }}>

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem',
            marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          ← Back to Dashboard
        </button>

        {/* ── HEADER ── */}
        <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontFamily: 'var(--font-secondary)', fontWeight: 900,
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #4DAAFF, #B07FFF)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Your Learning Path 🗺️
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
            Personalized just for you — follow the path to level up!
          </p>
        </div>

        {/* ── SKILL LEVEL + XP ── */}
        <div className="animate-slide-up" style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.2rem',
          alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap',
        }}>
          <SkillBadge skillLevel={skillLevel} />
          <XPBar xp={xp} />
        </div>

        {/* ── WEAK AREAS ── */}
        {weakAreas?.length > 0 && (
          <div className="animate-slide-up" style={{ marginBottom: '1.5rem', animationDelay: '0.1s' }}>
            <WeakAreaPanel weakAreas={weakAreas} />
          </div>
        )}

        {/* ── LEARNING PATH ── */}
        <div className="glass-panel animate-slide-up" style={{ padding: '2rem', marginBottom: '1.5rem', animationDelay: '0.15s' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '1.5rem' }}>
            📍 Your Recommended Path
          </h3>

          {learningPath.length > 0 ? (
            <div>
              {learningPath.map((item, i) => (
                <PathCard
                  key={`${item.section}-${i}`}
                  item={item}
                  index={i}
                  isFirst={i === 0}
                  onClick={() => navigate(item.route)}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No path generated yet. Complete the assessment first!
            </div>
          )}
        </div>

        {/* ── BADGES ── */}
        <div className="glass-panel animate-slide-up" style={{ padding: '2rem', marginBottom: '1.5rem', animationDelay: '0.2s' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '1.2rem' }}>
            🏆 Badges & Achievements
          </h3>
          <BadgeGrid badges={badges} />
        </div>

        {/* ── CTA ── */}
        <div className="animate-slide-up" style={{ textAlign: 'center', animationDelay: '0.25s' }}>
          {learningPath[0] && (
            <button
              onClick={() => navigate(learningPath[0].route)}
              style={{
                padding: '1rem 3rem', fontSize: '1.1rem', fontWeight: 800,
                background: `linear-gradient(135deg, ${cfg.color}, #B07FFF)`,
                color: 'white', border: 'none', borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                boxShadow: `0 8px 28px ${cfg.color}40`,
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font-primary)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {learningPath[0].icon} Start: {learningPath[0].label}
            </button>
          )}
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.8rem' }}>
            Your path adapts as you practice — keep going!
          </p>
        </div>
      </main>
    </div>
  );
}
