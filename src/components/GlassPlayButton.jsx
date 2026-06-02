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
        border: '2px solid rgba(255,255,255,0.9)',
        background: isPlaying ? '#ffffff' : 'rgba(255,255,255,0.12)',
        color: isPlaying ? '#000' : '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.35), inset 0 0 8px rgba(255,255,255,0.18)',
        outline: 'none',
        padding: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.background = isPlaying ? '#fff' : 'rgba(255,255,255,0.22)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.45), inset 0 0 12px rgba(255,255,255,0.28)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.background = isPlaying ? '#fff' : 'rgba(255,255,255,0.12)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.35), inset 0 0 8px rgba(255,255,255,0.18)';
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
