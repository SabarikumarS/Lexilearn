import React, { useEffect, useState } from 'react';

export default function LogoLoader() {
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDot(d => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #4DAAFF 0%, #7B6FFF 50%, #B07FFF 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      gap: '2rem'
    }}>
      {/* Floating decoration circles */}
      {[
        { size: 120, top: '8%',  left: '5%',  opacity: 0.15, delay: '0s' },
        { size: 80,  top: '15%', right: '10%',opacity: 0.12, delay: '0.5s' },
        { size: 60,  bottom:'10%',left: '15%', opacity: 0.10, delay: '1s' },
        { size: 100, bottom:'5%', right: '8%', opacity: 0.13, delay: '0.3s' },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: c.size, height: c.size,
          borderRadius: '50%',
          backgroundColor: 'white',
          opacity: c.opacity,
          top: c.top, left: c.left, right: c.right, bottom: c.bottom,
          animation: `float 4s ease-in-out ${c.delay} infinite`
        }} />
      ))}

      {/* Logo */}
      <div style={{ animation: 'float 3s ease-in-out infinite', textAlign: 'center' }}>
        <div style={{
          width: '110px', height: '110px',
          borderRadius: '30px',
          backgroundColor: 'rgba(255,255,255,0.25)',
          backdropFilter: 'blur(10px)',
          border: '3px solid rgba(255,255,255,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3.5rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          margin: '0 auto 1rem'
        }}>
          📚
        </div>
        <div style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '3rem',
          fontWeight: 900,
          color: 'white',
          letterSpacing: '-0.5px',
          textShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          Lexi<span style={{ color: '#FFD15E' }}>Learn</span>
        </div>
      </div>

      <p style={{
        color: 'rgba(255,255,255,0.85)',
        fontSize: '1.25rem',
        fontFamily: "'Lexend', sans-serif",
        letterSpacing: '0.5px'
      }}>
        Loading your adventure{'.'.repeat(dot + 1)}
      </p>

      {/* Bouncing dots */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '14px', height: '14px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.9)',
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
          }} />
        ))}
      </div>
    </div>
  );
}