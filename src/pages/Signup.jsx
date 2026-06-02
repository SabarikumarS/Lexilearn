import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AnimatedButton from '../components/AnimatedButton';
import { useAuth } from '../context/AuthContext';

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <span style={{ color: '#FF4D4D', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.15rem' }}>
      ⚠ {msg}
    </span>
  );
}

function inputStyle(hasError) {
  return {
    padding: '0.9rem 1rem', borderRadius: 'var(--radius-sm)',
    border: `2px solid ${hasError ? '#FF4D4D' : '#E2E8F0'}`,
    fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };
}

function getPasswordStrength(pwd) {
  if (!pwd) return { label: '', color: '#E2E8F0', width: '0%' };
  let score = 0;
  if (pwd.length >= 8)            score++;
  if (/[A-Z]/.test(pwd))          score++;
  if (/[0-9]/.test(pwd))          score++;
  if (/[^A-Za-z0-9]/.test(pwd))  score++;
  const levels = [
    { label: 'Too short', color: '#FF4D4D', width: '15%' },
    { label: 'Weak',      color: '#FF8C42', width: '30%' },
    { label: 'Fair',      color: '#FFD15E', width: '55%' },
    { label: 'Good',      color: '#5DD87A', width: '80%' },
    { label: 'Strong',    color: '#00C2A8', width: '100%' },
  ];
  return levels[Math.min(score, 4)];
}

export default function Signup() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const strength = getPasswordStrength(password);

  const validate = () => {
    const e = {};
    if (!name.trim())     e.name     = 'Name is required';
    if (!email.trim())    e.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
    if (!password)        e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleGoogleSignup = async () => {
    try { setErrors({}); setLoading(true); await signInWithGoogle(); }
    catch (err) { setErrors({ form: 'Google sign-up failed: ' + err.message }); }
    finally     { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const result = await signUp(email, password, name);
      // If email confirmation is required, Supabase returns user but session=null
      const needsConfirmation = result?.user && !result?.session;
      if (needsConfirmation) {
        setSuccess(true);
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrors({ form: 'Sign up failed: ' + err.message });
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', padding: '1rem',
      }}>
        <div className="glass-panel animate-fade-in" style={{
          padding: '3rem', maxWidth: '420px', width: '100%', textAlign: 'center',
          borderRadius: '20px', background: 'rgba(255,255,255,0.97)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📧</div>
          <h2 style={{ color: 'var(--color-success)', marginBottom: '0.75rem' }}>Check your email!</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            We've sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account, then come back to log in.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <AnimatedButton variant="primary" fullWidth onClick={() => navigate('/login')}>
              Go to Login →
            </AnimatedButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      padding: '1rem',
    }}>
      <div className="glass-panel animate-fade-in" style={{
        padding: '2.5rem 2.8rem', width: '100%', maxWidth: '440px',
        display: 'flex', flexDirection: 'column', gap: '1.2rem',
        borderRadius: '20px', background: 'rgba(255,255,255,0.97)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.3rem' }}>🌟</div>
          <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-secondary)', color: 'var(--color-primary)', letterSpacing: '-1px', marginBottom: '0.2rem' }}>
            Lexi<span style={{ color: 'var(--color-success)' }}>Learn</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Create your account to get started!</p>
        </div>

        {errors.form && (
          <div style={{
            padding: '0.85rem 1rem', background: '#FFF0F0', border: '1.5px solid #FFAAAA',
            borderRadius: 'var(--radius-sm)', color: '#C0392B', fontSize: '0.9rem', fontWeight: 600,
          }}>
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }} noValidate>
          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Your Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Alex" style={inputStyle(!!errors.name)}
              onFocus={e => e.target.style.borderColor = 'var(--color-success)'}
              onBlur={e  => e.target.style.borderColor = errors.name ? '#FF4D4D' : '#E2E8F0'}
            />
            <FieldError msg={errors.name} />
          </div>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="parent@email.com" style={inputStyle(!!errors.email)}
              onFocus={e => e.target.style.borderColor = 'var(--color-success)'}
              onBlur={e  => e.target.style.borderColor = errors.email ? '#FF4D4D' : '#E2E8F0'}
            />
            <FieldError msg={errors.email} />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters" style={inputStyle(!!errors.password)}
              onFocus={e => e.target.style.borderColor = 'var(--color-success)'}
              onBlur={e  => e.target.style.borderColor = errors.password ? '#FF4D4D' : '#E2E8F0'}
            />
            {/* Password strength bar */}
            {password && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                <div style={{ flex: 1, height: '5px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: strength.width, height: '100%', background: strength.color, transition: 'width 0.3s, background 0.3s', borderRadius: '3px' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: strength.color, fontWeight: 700, minWidth: '50px' }}>{strength.label}</span>
              </div>
            )}
            <FieldError msg={errors.password} />
          </div>

          {/* Confirm Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your password" style={inputStyle(!!errors.confirm)}
              onFocus={e => e.target.style.borderColor = 'var(--color-success)'}
              onBlur={e  => e.target.style.borderColor = errors.confirm ? '#FF4D4D' : '#E2E8F0'}
            />
            <FieldError msg={errors.confirm} />
          </div>

          <AnimatedButton type="submit" variant="success" fullWidth disabled={loading} style={{ marginTop: '0.4rem' }}>
            {loading ? 'Creating Account…' : 'Create Account 🚀'}
          </AnimatedButton>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          </div>

          <AnimatedButton type="button" variant="outline" fullWidth onClick={handleGoogleSignup} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Continue with Google
          </AnimatedButton>
        </form>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Log in</Link>
          </p>
          <AnimatedButton variant="ghost" size="sm" onClick={() => navigate('/')}>
            Continue as Guest 👤
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}