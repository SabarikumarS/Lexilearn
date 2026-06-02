import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ProgressCard from '../components/ProgressCard';
import LogoLoader from '../components/LogoLoader';
import LexiLogo from '../components/LexiLogo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { useAssessment } from '../context/AssessmentContext';
import { useNavigate } from 'react-router-dom';
import { getRecommendedActivity } from '../services/adaptiveLearning';
import { SKILL_LEVEL_CONFIG } from '../services/assessmentService';

const CARDS = [
  {
    title: 'Reading Practice',
    icon: '📖',
    emoji: '📖',
    color: '#4DAAFF',
    to: '/reading',
    description: 'Read stories and practise words with interactive highlighting.',
    gradient: 'linear-gradient(135deg, #EEF6FF 0%, #D1EBFF 100%)',
    glowColor: 'rgba(77,170,255,0.35)',
    cta: 'Start Reading →',
  },
  {
    title: 'Speech Practice',
    icon: '🎤',
    emoji: '🎤',
    color: '#5DD87A',
    to: '/speech',
    description: 'Practise pronouncing words and get instant AI feedback.',
    gradient: 'linear-gradient(135deg, #EDFFF5 0%, #C5F0CF 100%)',
    glowColor: 'rgba(93,216,122,0.35)',
    cta: 'Start Speaking →',
  },
  {
    title: 'Learning Games',
    icon: '🎮',
    emoji: '🎮',
    color: '#FFD15E',
    to: '/games',
    description: 'Play fun word games and earn stars and badges!',
    gradient: 'linear-gradient(135deg, #FFFBED 0%, #FFE9A0 100%)',
    glowColor: 'rgba(255,209,94,0.35)',
    cta: 'Play Now →',
  },
  {
    title: 'My Progress',
    icon: '🏆',
    emoji: '🏆',
    color: '#B07FFF',
    to: '/progress',
    description: 'See how far you\'ve come and the badges you\'ve earned!',
    gradient: 'linear-gradient(135deg, #F4EEFF 0%, #E8D9FF 100%)',
    glowColor: 'rgba(176,127,255,0.35)',
    cta: 'View Progress →',
  },
];

// Animated count-up hook
function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { progress } = useProgress();   // ← single source of truth
  const { skillLevel, skillConfig, topRecommendations, assessmentDone, xp } = useAssessment();
  const [recommendation, setRecommendation] = useState(null);

  // Brief animation gate (replaces the old 1.4s artificial delay)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setRecommendation(getRecommendedActivity());
  }, []);

  const points    = useCountUp(progress?.totalPoints    || 0, 900);
  const lessons   = useCountUp(progress?.lessonsCompleted || 0, 900);
  const streak    = useCountUp(progress?.streakDays     || 0, 900);
  const avgScore  = useCountUp(progress?.avgAccuracy    || 0, 900);

  if (loading) return <LogoLoader />;

  const displayName = user?.user_metadata?.full_name || (user ? 'Learner' : 'Explorer');
  const hour        = new Date().getHours();
  const greeting    = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const { isDark }  = useTheme();

  const cfg = skillConfig || SKILL_LEVEL_CONFIG[skillLevel] || SKILL_LEVEL_CONFIG.beginner;

  const stats = [
    { emoji: '⭐', label: 'Points',   value: points,        color: '#FF9A5E', bg: isDark ? 'rgba(255,154,94,0.12)' : '#FFF2E8',  border: '#FFD15E' },
    { emoji: '📚', label: 'Lessons',  value: lessons,       color: '#4DAAFF', bg: isDark ? 'rgba(77,170,255,0.12)' : '#EEF6FF',  border: '#4DAAFF' },
    { emoji: '🔥', label: 'Streak',   value: streak,        color: '#FF7B7B', bg: isDark ? 'rgba(255,123,123,0.12)' : '#FFF0F0', border: '#FF7B7B' },
    { emoji: '🎯', label: 'Avg Score',value: `${avgScore}%`,color: '#5DD87A', bg: isDark ? 'rgba(93,216,122,0.12)' : '#EDFFF5', border: '#5DD87A' },
    ...(assessmentDone ? [{ emoji: cfg.emoji, label: cfg.label, value: `${xp} XP`, color: cfg.color, bg: isDark ? cfg.bgColor : cfg.bgColor, border: cfg.color }] : []),
  ];

  return (
    <div className="app-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background gradient orbs */}
      <div className="bg-orb bg-orb-blue"   style={{ width:'500px', height:'500px', top:'-150px', left:'-150px', animationDelay:'0s' }} />
      <div className="bg-orb bg-orb-purple" style={{ width:'400px', height:'400px', top:'30%', right:'-120px',  animationDelay:'4s' }} />
      <div className="bg-orb bg-orb-green"  style={{ width:'350px', height:'350px', bottom:'-100px', left:'20%', animationDelay:'8s' }} />
      <div className="bg-orb bg-orb-yellow" style={{ width:'300px', height:'300px', bottom:'10%', right:'15%', animationDelay:'2s' }} />

      <Navbar user={user} onLogout={signOut} />

      <main style={{
        flex: 1,
        padding: '3rem 2rem 5rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* ── HERO SECTION ── */}
        <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          {/* Logo */}
          <div style={{ marginBottom: '1.2rem', display: 'inline-block' }}>
            <LexiLogo size="lg" />
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.8rem)',
            fontFamily: 'var(--font-secondary)', fontWeight: 900,
            lineHeight: 1.15, marginBottom: '0.8rem',
          }}>
            <span style={{ color: 'var(--text-main)' }}>{greeting}, </span>
            <span style={{
              background: 'linear-gradient(135deg, #4DAAFF, #B07FFF)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>
              {displayName}!
            </span>
          </h1>

          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Ready to learn something amazing today? ✨
          </p>

          {/* Stats row */}
          {progress && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {stats.map((stat, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  background: stat.bg,
                  border: `1.5px solid ${stat.border}40`,
                  borderRadius: 'var(--radius-full)',
                  padding: '0.5rem 1.3rem',
                  fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem',
                  animation: `popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08}s both`,
                  boxShadow: `0 4px 12px ${stat.border}25`,
                }}>
                  <span>{stat.emoji}</span>
                  <span style={{ color: stat.color, fontSize: '1.05rem' }}>{stat.value}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem' }}>{stat.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Guest nudge */}
          {!user && (
            <div className="animate-slide-up" style={{
              marginTop: '1rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.6rem 1.6rem',
              background: 'linear-gradient(135deg, rgba(77,170,255,0.08), rgba(176,127,255,0.08))',
              borderRadius: 'var(--radius-full)',
              border: '1.5px solid rgba(77,170,255,0.2)',
              fontSize: '0.9rem', color: 'var(--text-muted)',
            }}>
              <span>👤 Exploring as Guest —</span>
              <button onClick={() => navigate('/login')} style={{
                color: 'var(--color-primary)', fontWeight: 700,
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem',
              }}>
                Sign in to save progress →
              </button>
            </div>
          )}
        </div>

        {/* ── ASSESSMENT CTA BANNER ──────────────────────────────── */}
        {!assessmentDone && (
          <div className="animate-slide-up" style={{
            marginBottom: '2.5rem',
            padding: '1.8rem 2.2rem',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, #4DAAFF18, #B07FFF18)',
            border: '2px solid rgba(77,170,255,0.3)',
            display: 'flex', alignItems: 'center', gap: '1.5rem',
            flexWrap: 'wrap',
            boxShadow: '0 8px 32px rgba(77,170,255,0.12)',
            animationDelay: '0.1s',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Glow orb */}
            <div style={{
              position: 'absolute', right: '-60px', top: '-60px',
              width: '200px', height: '200px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(176,127,255,0.2), transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{
              width: '64px', height: '64px', borderRadius: '18px', flexShrink: 0,
              background: 'linear-gradient(135deg, #4DAAFF, #B07FFF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: '0 8px 24px rgba(77,170,255,0.4)',
            }}>
              🎯
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{
                fontWeight: 900, fontSize: '1.15rem',
                color: 'var(--text-main)', marginBottom: '0.3rem',
                fontFamily: 'var(--font-secondary)',
              }}>
                Unlock Your Personalized Learning Path!
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                Take a quick 15-question skills check (~5 min) and we'll build
                a learning plan made just for you. 🚀
              </div>
            </div>

            <button
              id="start-assessment-btn"
              onClick={() => {
                if (!user) {
                  // Guest → flag intent, go to login
                  sessionStorage.setItem('lexilearn:pendingAssessment', 'true');
                  navigate('/login');
                } else {
                  navigate('/assessment');
                }
              }}
              style={{
                padding: '0.85rem 2rem',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #4DAAFF, #B07FFF)',
                color: 'white', border: 'none',
                fontWeight: 800, fontSize: '1rem',
                fontFamily: 'var(--font-secondary)',
                cursor: 'pointer', whiteSpace: 'nowrap',
                boxShadow: '0 6px 20px rgba(77,170,255,0.5)',
                transition: 'all 0.25s ease',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.04)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(77,170,255,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(77,170,255,0.5)'; }}
            >
              {user ? 'Start Skills Check 🚀' : 'Sign In & Start →'}
            </button>
          </div>
        )}

        {/* Retake link (shown only if done) */}
        {assessmentDone && (
          <div style={{ textAlign: 'right', marginBottom: '0.5rem', marginTop: '-1rem' }}>
            <button
              onClick={() => navigate('/assessment')}
              style={{
                background: 'none', border: 'none',
                color: 'var(--text-muted)', fontSize: '0.82rem',
                cursor: 'pointer', textDecoration: 'underline dotted',
              }}
            >
              🔄 Retake Assessment
            </button>
          </div>
        )}

        {/* ── PERSONALIZED LEARNING PATH SECTION ── */}
        {assessmentDone && topRecommendations.length > 0 && (
          <div className="animate-slide-up" style={{ marginBottom: '2.5rem', animationDelay: '0.12s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                🗺️ Your Learning Path
              </h2>
              <button
                onClick={() => navigate('/learning-path')}
                style={{
                  background: 'none', border: `1.5px solid ${cfg.color}50`,
                  borderRadius: 'var(--radius-full)', padding: '0.3rem 1rem',
                  color: cfg.color, fontWeight: 700, fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                View Full Path →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.9rem' }}>
              {topRecommendations.map((item, i) => {
                const pColor = item.priority === 'high' ? '#FF7B7B' : item.priority === 'medium' ? '#FFD15E' : '#5DD87A';
                return (
                  <button
                    key={i}
                    onClick={() => navigate(item.route)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '1rem 1.2rem',
                      background: i === 0
                        ? `linear-gradient(135deg, ${pColor}18, ${pColor}08)`
                        : 'var(--card-bg)',
                      border: `1.5px solid ${pColor}${i === 0 ? '60' : '30'}`,
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${pColor}25`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: `linear-gradient(135deg, ${pColor}40, ${pColor}20)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem', flexShrink: 0,
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.92rem', marginBottom: '2px' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: pColor, fontWeight: 600, textTransform: 'capitalize' }}>
                        {item.priority} priority{i === 0 ? ' · Start here!' : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RECOMMENDATION BANNER ── */}
        {recommendation && (
          <div className="animate-slide-up glass-panel" style={{
            padding: '1.3rem 2rem', marginBottom: '2.5rem',
            display: 'flex', alignItems: 'center', gap: '1.2rem',
            background: 'linear-gradient(135deg, rgba(77,170,255,0.1), rgba(176,127,255,0.1))',
            border: '1.5px solid rgba(77,170,255,0.2)',
            animationDelay: '0.15s',
          }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #4DAAFF, #B07FFF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', flexShrink: 0,
              boxShadow: '0 6px 16px rgba(77,170,255,0.35)',
            }}>
              {recommendation.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.15rem' }}>
                ✨ Recommended for you
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>{recommendation.message}</div>
            </div>
            <button
              onClick={() => navigate(`/${recommendation.type}`)}
              style={{
                padding: '0.55rem 1.4rem',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #4DAAFF, #7B6FFF)',
                color: 'white', border: 'none',
                fontWeight: 700, fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(77,170,255,0.4)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(77,170,255,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(77,170,255,0.4)'; }}
            >
              Go →
            </button>
          </div>
        )}

        {/* ── FEATURE CARDS ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.75rem',
        }}>
          {CARDS.map((card, i) => (
            <div key={card.to} style={{ animation: `cardEntrance 0.6s cubic-bezier(0.34,1.2,0.64,1) ${i * 0.1}s both` }}>
              <ProgressCard {...card} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}