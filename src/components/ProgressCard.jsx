import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function ProgressCard({ title, icon, color, to, description, gradient, glowColor, cta }) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [hovered, setHovered] = useState(false);
  const bg = isDark
    ? `linear-gradient(135deg, ${color}18, ${color}08)`   // subtle in dark mode
    : (gradient || `linear-gradient(135deg, ${color}20, ${color}0a)`);
  const glow = glowColor || `${color}40`;

  return (
    <div
      onClick={() => navigate(to)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: bg,
        borderRadius: 'var(--radius-lg)',
        padding: '2.2rem 1.8rem 1.8rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        cursor: 'pointer',
        border: `2px solid ${color}${hovered ? '50' : '25'}`,
        position: 'relative',
        overflow: 'hidden',
        minHeight: '240px',
        transition: 'all 0.35s cubic-bezier(0.34,1.2,0.64,1)',
        transform: hovered ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: hovered
          ? `0 20px 50px ${glow}, 0 8px 20px rgba(0,0,0,0.08)`
          : 'var(--shadow-md)',
      }}
    >
      {/* Decorative corner circle */}
      <div style={{
        position: 'absolute', bottom: '-30px', right: '-30px',
        width: '130px', height: '130px', borderRadius: '50%',
        background: `${color}12`, pointerEvents: 'none',
        transition: 'transform 0.35s ease',
        transform: hovered ? 'scale(1.3)' : 'scale(1)',
      }} />
      <div style={{
        position: 'absolute', top: '-20px', left: '-20px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: `${color}08`, pointerEvents: 'none',
      }} />

      {/* Icon circle */}
      <div style={{
        width: '96px', height: '96px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}35, ${color}18)`,
        border: `3px solid ${color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '3rem',
        marginBottom: '1.25rem',
        boxShadow: hovered ? `0 10px 28px ${glow}` : `0 6px 16px ${color}25`,
        transition: 'all 0.35s ease',
        transform: hovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1) rotate(0deg)',
      }}>
        {icon}
      </div>

      <h2 style={{
        fontSize: '1.35rem', marginBottom: '0.5rem',
        color: 'var(--text-main)', fontFamily: 'var(--font-secondary)', fontWeight: 800,
      }}>
        {title}
      </h2>

      {description && (
        <p style={{
          fontSize: '0.9rem', color: 'var(--text-muted)',
          lineHeight: 1.55, maxWidth: '200px', marginBottom: '1.2rem',
          flex: 1,
        }}>
          {description}
        </p>
      )}

      {/* CTA pill */}
      <div style={{
        padding: '0.5rem 1.4rem',
        borderRadius: 'var(--radius-full)',
        background: hovered
          ? `linear-gradient(135deg, ${color}, ${color}cc)`
          : `${color}20`,
        color: hovered ? 'white' : color,
        fontWeight: 700, fontSize: '0.9rem',
        transition: 'all 0.3s ease',
        boxShadow: hovered ? `0 4px 14px ${glow}` : 'none',
      }}>
        {cta || 'Start →'}
      </div>
    </div>
  );
}