import React from 'react';

const GlassPlayButton = ({ isPlaying, onClick, size = 44, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`glass-play-button ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        border: '1.5px solid rgba(255,255,255,0.18)',
        background: isPlaying ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.08)',
        color: isPlaying ? '#000' : '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        boxShadow: '0 4px 18px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.15)',
        outline: 'none',
        padding: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.background = isPlaying ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.18)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)';
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.background = isPlaying ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.10)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)';
        e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.15)';
      }}
    >
      {isPlaying ? (
        <svg width={size * 0.3} height={size * 0.3} viewBox="0 0 10 10" fill="currentColor">
          <rect x="1" y="0" width="3" height="10" rx="0.5" />
          <rect x="6" y="0" width="3" height="10" rx="0.5" />
        </svg>
      ) : (
        <svg width={size * 0.33} height={size * 0.33} viewBox="0 0 10 10" fill="currentColor" style={{ marginLeft: '2px' }}>
          <polygon points="1,0 10,5 1,10" />
        </svg>
      )}
    </button>
  );
};

export default GlassPlayButton;
