import React from 'react';

export default function AnimatedButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className = '',
  disabled = false,
  fullWidth = false,
  type = 'button',
  style: extraStyle = {}
}) {
  const getVariantStyles = () => {
    switch(variant) {
      case 'primary':  return { background: 'linear-gradient(135deg, #4DAAFF, #7B6FFF)', color: 'white', border: 'none' };
      case 'success':  return { background: 'linear-gradient(135deg, #5DD87A, #3ECFA8)', color: 'white', border: 'none' };
      case 'warning':  return { background: 'linear-gradient(135deg, #FFD15E, #FF9A5E)', color: '#3a2000', border: 'none' };
      case 'danger':   return { background: 'linear-gradient(135deg, #FF7B7B, #FF4444)', color: 'white', border: 'none' };
      case 'gradient': return { background: 'linear-gradient(135deg, #B07FFF, #4DAAFF, #5DD87A)', backgroundSize: '200%', color: 'white', border: 'none' };
      case 'outline':  return { background: 'transparent', color: 'var(--color-primary)', border: '2px solid var(--color-primary)' };
      case 'ghost':    return { background: 'transparent', color: 'var(--text-muted)', border: 'none' };
      default:         return { background: 'linear-gradient(135deg, #4DAAFF, #7B6FFF)', color: 'white', border: 'none' };
    }
  };

  const getSizeStyles = () => {
    switch(size) {
      case 'sm': return { padding: '8px 18px', fontSize: '0.95rem' };
      case 'lg': return { padding: '16px 36px', fontSize: '1.35rem' };
      default:   return { padding: '12px 26px', fontSize: '1.1rem' };
    }
  };

  const style = {
    ...getVariantStyles(),
    ...getSizeStyles(),
    borderRadius: 'var(--radius-full)',
    fontWeight: '700',
    fontFamily: 'var(--font-primary)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    boxShadow: (variant !== 'ghost' && variant !== 'outline') ? 'var(--shadow-md)' : 'none',
    width: fullWidth ? '100%' : 'auto',
    transition: 'all 0.25s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transform: 'scale(1)',
    letterSpacing: '0.3px',
    ...extraStyle,
  };

  return (
    <button 
      type={type}
      style={style}
      className={`animated-btn ${className}`}
      onClick={onClick}
      disabled={disabled}
      onMouseOver={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
          if (variant !== 'ghost' && variant !== 'outline') {
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          }
          if (variant === 'gradient') {
            e.currentTarget.style.backgroundPosition = '100% center';
          }
        }
      }}
      onMouseOut={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          if (variant !== 'ghost' && variant !== 'outline') {
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }
          if (variant === 'gradient') {
            e.currentTarget.style.backgroundPosition = '0% center';
          }
        }
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.95)'; }}
      onMouseUp={(e) => { if (!disabled) e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'; }}
    >
      {children}
    </button>
  );
}