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
        border: '2px solid #fff',
        background: isPlaying ? '#fff' : 'transparent',
        color: isPlaying ? '#000' : '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3), inset 0 0 8px rgba(255,255,255,0.2)',
        outline: 'none',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.08)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4), inset 0 0 12px rgba(255,255,255,0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3), inset 0 0 8px rgba(255,255,255,0.2)';
      }}
    >
      {isPlaying ? (
        <svg width={size * 0.32} height={size * 0.32} viewBox="0 0 10 10" fill="currentColor">
          <rect x="1" y="0" width="3" height="10" />
          <rect x="6" y="0" width="3" height="10" />
        </svg>
      ) : (
        <svg width={size * 0.35} height={size * 0.35} viewBox="0 0 10 10" fill="currentColor" style={{ marginLeft: '2px' }}>
          <polygon points="1,0 10,5 1,10" />
        </svg>
      )}
    </button>
  );
};

export default GlassPlayButton;
