import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const CONFETTI_COLORS = ['#4DAAFF','#FFD15E','#5DD87A','#B07FFF','#FF7B7B','#3ECFA8','#FF9A5E'];

function ConfettiPiece({ color, left, delay, size }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${left}%`,
      top: '-10px',
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: color,
      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      animation: `confettiFall ${1.2 + Math.random() * 0.8}s ease-in ${delay}s forwards`,
      zIndex: 10
    }} />
  );
}

export default function CelebrationModal({ onClose, score, title = '🎉 Amazing Job!', subtitle }) {
  const { isDark } = useTheme();
  const [pieces] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      size: 8 + Math.random() * 8
    }))
  );

  useEffect(() => {
    const timer = setTimeout(() => onClose?.(), 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(20, 30, 48, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 999
    }} onClick={onClose}>
      {/* Confetti */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {pieces.map(p => <ConfettiPiece key={p.id} {...p} />)}
      </div>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: isDark ? 'rgba(30,41,59,0.97)' : 'rgba(255,255,255,0.96)',
          borderRadius: 'var(--radius-xl)',
          padding: '3rem 3.5rem',
          textAlign: 'center',
          boxShadow: isDark
            ? '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(77,170,255,0.15)'
            : '0 30px 80px rgba(0,0,0,0.25)',
          maxWidth: '420px',
          width: '90%',
          animation: 'celebrate 0.6s ease-out',
          position: 'relative',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
          transition: 'background 0.3s ease',
        }}
      >
        {/* Stars */}
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem', animation: 'bounce 1s ease-in-out infinite' }}>
          ⭐
        </div>

        <h2 style={{
          fontSize: '2.2rem',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #4DAAFF, #B07FFF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {title}
        </h2>

        {subtitle && (
          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {subtitle}
          </p>
        )}

        {score !== undefined && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #FFD15E, #FF9A5E)',
            borderRadius: 'var(--radius-full)',
            padding: '0.6rem 1.8rem',
            marginBottom: '1.5rem',
            color: '#5a3a00', fontWeight: 800, fontSize: '1.4rem',
            boxShadow: '0 4px 15px rgba(255,180,80,0.4)'
          }}>
            🏆 {score} pts
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.9rem 2.2rem',
              background: 'linear-gradient(135deg, #4DAAFF, #7B6FFF)',
              color: 'white',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '1.1rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(77,170,255,0.4)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Continue 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
