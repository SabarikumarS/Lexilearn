import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AnimatedButton from '../components/AnimatedButton';
import LexiLogo from '../components/LexiLogo';

// ── Google SVG icon ──────────────────────────────────────────
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ── Reusable field with label, input, and error ───────────────
function Field({ label, type, value, onChange, placeholder, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <label style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{label}</label>
      <input
        className={`auth-input${error ? ' error' : ''}`}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'name'}
      />
      {error && (
        <span style={{ color: 'var(--color-danger)', fontSize: '0.82rem', fontWeight: 600 }}>
          ⚠ {error}
        </span>
      )}
    </div>
  );
}

// ── Error banner ─────────────────────────────────────────────
function ErrorBanner({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      padding: '0.85rem 1rem',
      background: 'linear-gradient(135deg, #FFF0F0, #FFE0E0)',
      border: '1.5px solid #FFB3B3',
      borderRadius: 'var(--radius-sm)',
      color: '#C0392B',
      fontSize: '0.9rem',
      fontWeight: 600,
      animation: 'popIn 0.3s ease-out forwards',
    }}>
      {msg}
    </div>
  );
}

// ── Success toast ─────────────────────────────────────────────
function SuccessToast({ show, toAssessment }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', top: '24px', left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #5DD87A, #3ECFA8)',
      color: 'white', fontWeight: 800,
      padding: '0.9rem 2rem',
      borderRadius: 'var(--radius-full)',
      boxShadow: '0 12px 32px rgba(93,216,122,0.5)',
      zIndex: 9999,
      animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
      fontSize: '1rem',
    }}>
      {toAssessment ? '🎯 Starting your assessment…' : '🎉 Welcome to LexiLearn! Redirecting…'}
    </div>
  );
}

// ── Decorative floating orbs for left panel ───────────────────
const ORB_ITEMS = [
  { emoji: '📖', top: '12%',  left: '15%',  size: '3rem', delay: '0s' },
  { emoji: '✏️',  top: '30%',  left: '70%',  size: '2.2rem', delay: '0.5s' },
  { emoji: '⭐',  top: '58%',  left: '20%',  size: '2.8rem', delay: '1s' },
  { emoji: '🎯',  top: '72%',  left: '65%',  size: '2rem',  delay: '1.5s' },
  { emoji: '🌈',  top: '85%',  left: '35%',  size: '2.4rem', delay: '0.8s' },
  { emoji: '💡',  top: '20%',  left: '45%',  size: '2rem',  delay: '0.3s' },
];

// ────────────────────────────────────────────────────────────
// LOGIN FORM
// ────────────────────────────────────────────────────────────
function LoginForm({ onSwitch }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!email.trim())  e.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password)      e.password = 'Password is required';
    else if (password.length < 6) e.password = 'At least 6 characters';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await signIn(email, password);
      setSuccess(true);
      const pending = sessionStorage.getItem('lexilearn:pendingAssessment');
      if (pending) {
        sessionStorage.removeItem('lexilearn:pendingAssessment');
        setTimeout(() => navigate('/assessment'), 1000);
      } else {
        setTimeout(() => navigate('/'), 1400);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('email not confirmed')) {
        setErrors({ form: '📧 Please confirm your email first. Check your inbox.' });
      } else if (msg.toLowerCase().includes('invalid login')) {
        setErrors({ form: '❌ Incorrect email or password.' });
      } else {
        setErrors({ form: 'Sign in failed: ' + msg });
      }
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    try { setErrors({}); setLoading(true); await signInWithGoogle(); }
    catch (err) { setErrors({ form: 'Google sign-in failed: ' + err.message }); }
    finally { setLoading(false); }
  };

  return (
    <>
      <SuccessToast show={success} toAssessment={sessionStorage.getItem('lexilearn:pendingAssessment') === 'true'} />
      <div className="auth-tab-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <ErrorBanner msg={errors.form} />
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Email Address" type="email" value={email} onChange={setEmail}
            placeholder="you@example.com" error={errors.email} />
          <Field label="Password" type="password" value={password} onChange={setPassword}
            placeholder="••••••••" error={errors.password} />

          <button type="submit" disabled={loading} style={{
            padding: '0.95rem',
            borderRadius: 'var(--radius-full)',
            background: loading ? '#aaa' : 'linear-gradient(135deg, #4DAAFF, #7B6FFF)',
            color: 'white', border: 'none',
            fontWeight: 800, fontSize: '1.1rem',
            fontFamily: 'var(--font-secondary)',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 6px 20px rgba(77,170,255,0.45)',
            transition: 'all 0.25s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(77,170,255,0.6)'; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(77,170,255,0.45)'; }}
          >
            {loading ? <><span className="spinner" /> Signing in…</> : 'Log In 🚀'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
        </div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading} className="google-btn" style={{
          padding: '0.85rem',
          borderRadius: 'var(--radius-full)',
          border: '2px solid #E2E8F0',
          fontWeight: 700, fontSize: '1rem',
          fontFamily: 'var(--font-primary)',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          transition: 'all 0.2s ease',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#4285F4'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(66,133,244,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <GoogleIcon /> Continue with Google
        </button>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Don't have an account?{' '}
          <button onClick={onSwitch} style={{ color: 'var(--color-primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
            Sign up →
          </button>
        </p>

        <button onClick={() => window.navigate?.('/') || (window.location.href = '/')}
          style={{ background: 'none', border: 'none', color: 'var(--text-light)', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center' }}>
          Continue as Guest 👤
        </button>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// SIGN UP FORM
// ────────────────────────────────────────────────────────────
function SignUpForm({ onSwitch }) {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!name.trim())   e.name     = 'Name is required';
    if (!email.trim())  e.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password)      e.password = 'Password is required';
    else if (password.length < 6) e.password = 'At least 6 characters';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await signUp(email, password, name);
      setSuccess(true);
      const pending = sessionStorage.getItem('lexilearn:pendingAssessment');
      if (pending) {
        sessionStorage.removeItem('lexilearn:pendingAssessment');
        setTimeout(() => navigate('/assessment'), 1000);
      } else {
        setTimeout(() => navigate('/'), 1400);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setErrors({ form: '📧 This email is already registered. Try logging in instead.' });
      } else {
        setErrors({ form: 'Sign up failed: ' + msg });
      }
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    try { setErrors({}); setLoading(true); await signInWithGoogle(); }
    catch (err) { setErrors({ form: 'Google sign-in failed: ' + err.message }); }
    finally { setLoading(false); }
  };

  return (
    <>
      <SuccessToast show={success} toAssessment={!!sessionStorage.getItem('lexilearn:pendingAssessment')} />
      <div className="auth-tab-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <ErrorBanner msg={errors.form} />
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <Field label="Your Name" type="text" value={name} onChange={setName}
            placeholder="Alex Smith" error={errors.name} />
          <Field label="Email Address" type="email" value={email} onChange={setEmail}
            placeholder="you@example.com" error={errors.email} />
          <Field label="Password" type="password" value={password} onChange={setPassword}
            placeholder="At least 6 characters" error={errors.password} />

          <button type="submit" disabled={loading} style={{
            marginTop: '0.3rem',
            padding: '0.95rem',
            borderRadius: 'var(--radius-full)',
            background: loading ? '#aaa' : 'linear-gradient(135deg, #5DD87A, #3ECFA8)',
            color: 'white', border: 'none',
            fontWeight: 800, fontSize: '1.1rem',
            fontFamily: 'var(--font-secondary)',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 6px 20px rgba(93,216,122,0.45)',
            transition: 'all 0.25s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(93,216,122,0.6)'; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(93,216,122,0.45)'; }}
          >
            {loading ? <><span className="spinner" /> Creating Account…</> : 'Create Account 🌟'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
        </div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading} className="google-btn" style={{
          padding: '0.85rem',
          borderRadius: 'var(--radius-full)',
          border: '2px solid #E2E8F0',
          fontWeight: 700, fontSize: '1rem',
          fontFamily: 'var(--font-primary)',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          transition: 'all 0.2s ease',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#4285F4'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(66,133,244,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <GoogleIcon /> Continue with Google
        </button>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <button onClick={onSwitch} style={{ color: 'var(--color-primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
            Log in →
          </button>
        </p>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// MAIN AUTH PAGE (Duolingo-style split screen)
// ────────────────────────────────────────────────────────────
export default function AuthPage({ defaultTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark
        ? 'linear-gradient(135deg, #0f172a 0%, #1a1535 50%, #0e2a20 100%)'
        : 'linear-gradient(135deg, #EEF6FF 0%, #F4EEFF 50%, #EDFFF5 100%)',
      padding: '1rem',
      transition: 'background 0.3s ease',
    }}>
      {/* Background orbs */}
      <div className="bg-orb bg-orb-blue"  style={{ width: '400px', height: '400px', top: '-100px', left: '-100px', animationDelay: '0s' }} />
      <div className="bg-orb bg-orb-purple" style={{ width: '350px', height: '350px', bottom: '-80px', right: '-80px', animationDelay: '3s' }} />
      <div className="bg-orb bg-orb-green"  style={{ width: '250px', height: '250px', bottom: '20%', left: '10%', animationDelay: '6s' }} />

      {/* Split-screen card */}
      <div className="auth-split animate-fade-in" style={{
        display: 'flex',
        width: '100%',
        maxWidth: '900px',
        minHeight: '580px',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(77,170,255,0.2), 0 12px 40px rgba(0,0,0,0.12)',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* ── LEFT PANEL ── */}
        <div className="auth-left" style={{
          flex: '1 1 45%',
          background: 'var(--grad-auth-left)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 2.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Floating decorations */}
          {ORB_ITEMS.map((item, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: item.top, left: item.left,
              fontSize: item.size,
              animation: `float ${4 + i * 0.6}s ease-in-out ${item.delay} infinite`,
              opacity: 0.75,
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))',
              userSelect: 'none',
            }}>
              {item.emoji}
            </div>
          ))}

          {/* Logo */}
          <div style={{
            marginBottom: '1.5rem',
            animation: 'none',  // LexiLogo has its own animation
            position: 'relative', zIndex: 1,
            display: 'flex', justifyContent: 'center',
          }}>
            <LexiLogo size="lg" />
          </div>

          <h2 style={{
            color: 'white',
            fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
            fontFamily: 'var(--font-secondary)',
            fontWeight: 900,
            textAlign: 'center',
            textShadow: '0 2px 12px rgba(0,0,0,0.2)',
            marginBottom: '1rem',
            position: 'relative', zIndex: 1,
          }}>
            LexiLearn 📚
          </h2>

          <p style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '1.1rem',
            textAlign: 'center',
            maxWidth: '260px',
            lineHeight: 1.6,
            fontWeight: 500,
            position: 'relative', zIndex: 1,
          }}>
            Learn to read. Find your voice. Unlock your superpowers! ✨
          </p>

          {/* Decorative bubbles */}
          <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="auth-right" style={{
          flex: '1 1 55%',
          background: isDark ? '#1e293b' : 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '3rem 2.8rem',
          overflowY: 'auto',
          transition: 'background 0.3s ease',
        }}>
          {/* Header */}
          <div style={{ marginBottom: '1.8rem' }}>
            <h1 style={{
              fontSize: '2rem',
              fontFamily: 'var(--font-secondary)',
              color: 'var(--text-main)',
              marginBottom: '0.3rem',
            }}>
              {activeTab === 'login' ? 'Welcome back! 👋' : 'Join LexiLearn! 🌟'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {activeTab === 'login'
                ? 'Sign in to continue your learning journey.'
                : 'Create your free account and start learning today.'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="tab-switcher" style={{ marginBottom: '1.8rem' }}>
            <button
              className={`tab-btn${activeTab === 'login' ? ' active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              🔑 Log In
            </button>
            <button
              className={`tab-btn${activeTab === 'signup' ? ' active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              ✨ Sign Up
            </button>
          </div>

          {/* Form content */}
          {activeTab === 'login'
            ? <LoginForm  key="login"  onSwitch={() => setActiveTab('signup')} />
            : <SignUpForm key="signup" onSwitch={() => setActiveTab('login')} />
          }

          {/* Guest link */}
          <div style={{ textAlign: 'center', marginTop: '1.4rem' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'none', border: 'none',
                color: 'var(--text-light)', fontSize: '0.88rem',
                cursor: 'pointer', fontFamily: 'var(--font-primary)',
                textDecoration: 'underline', textDecorationStyle: 'dotted',
              }}
            >
              Continue as Guest 👤 — no account needed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
