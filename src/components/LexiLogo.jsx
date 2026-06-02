import React from 'react';

/**
 * LexiLogo — Animated SVG brain + speech-wave logo for LexiLearn.
 * Replaces the owl emoji across the app.
 *
 * Props:
 *   size: 'sm' | 'md' | 'lg'  (default: 'md')
 *   animate: boolean            (default: true)
 */
export default function LexiLogo({ size = 'md', animate = true }) {
  const dim = { sm: 44, md: 80, lg: 120 }[size] ?? 80;
  const id  = `lexi-grad-${size}`;

  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        animation: animate ? 'lexiLogoBounce 3s ease-in-out infinite' : 'none',
        filter: 'drop-shadow(0 8px 20px rgba(77,170,255,0.4))',
        flexShrink: 0,
      }}
      aria-label="LexiLearn logo"
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#4DAAFF" />
          <stop offset="50%"  stopColor="#7B6FFF" />
          <stop offset="100%" stopColor="#B07FFF" />
        </linearGradient>
        <linearGradient id={`${id}-wave`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#4DAAFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#3ECFA8" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* ── Outer glow ring ── */}
      <circle
        cx="60" cy="60" r="56"
        fill={`url(#${id})`}
        opacity="0.12"
        style={{ animation: animate ? 'neuralPulse 2.5s ease-in-out infinite' : 'none' }}
      />

      {/* ── Brain body ── */}
      {/* Left hemisphere */}
      <path
        d="M60 28
           C44 28 30 38 28 53
           C26 62 30 70 36 75
           C34 80 36 86 42 88
           C48 90 56 86 60 84
           L60 28Z"
        fill={`url(#${id})`}
        opacity="0.95"
      />
      {/* Right hemisphere */}
      <path
        d="M60 28
           C76 28 90 38 92 53
           C94 62 90 70 84 75
           C86 80 84 86 78 88
           C72 90 64 86 60 84
           L60 28Z"
        fill={`url(#${id})`}
        opacity="0.85"
      />
      {/* Centre divider line */}
      <line x1="60" y1="30" x2="60" y2="82" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* ── Neural dots ── */}
      {[
        { cx: 42, cy: 46 }, { cx: 52, cy: 36 }, { cx: 44, cy: 60 },
        { cx: 50, cy: 72 }, { cx: 78, cy: 46 }, { cx: 68, cy: 36 },
        { cx: 76, cy: 60 }, { cx: 70, cy: 72 },
      ].map((dot, i) => (
        <circle
          key={i}
          cx={dot.cx} cy={dot.cy} r="3.5"
          fill="white"
          opacity="0.9"
          style={{ animation: animate ? `neuralPulse ${1.6 + i * 0.25}s ease-in-out ${i * 0.15}s infinite` : 'none' }}
        />
      ))}

      {/* ── Neural connection lines ── */}
      <line x1="42" y1="46" x2="52" y2="36" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <line x1="42" y1="46" x2="44" y2="60" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <line x1="44" y1="60" x2="50" y2="72" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <line x1="78" y1="46" x2="68" y2="36" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <line x1="78" y1="46" x2="76" y2="60" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <line x1="76" y1="60" x2="70" y2="72" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

      {/* ── Speech / sound waves (right side) ── */}
      <g style={{ animation: animate ? 'waveExpand 1.8s ease-in-out infinite' : 'none', transformOrigin: '92px 92px' }}>
        <path d="M90 82 Q96 88 90 94" stroke={`url(#${id}-wave)`} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M94 78 Q103 88 94 98" stroke={`url(#${id}-wave)`} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M98 74 Q110 88 98 102" stroke={`url(#${id}-wave)`} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.45" />
      </g>

      {/* ── Book / reading element at base ── */}
      <rect x="44" y="90" width="32" height="5" rx="2.5" fill="white" opacity="0.7" />
      <rect x="48" y="94" width="24" height="4" rx="2" fill="white" opacity="0.5" />
    </svg>
  );
}
