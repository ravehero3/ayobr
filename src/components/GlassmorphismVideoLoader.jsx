
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GlassmorphismVideoLoader = ({ 
  isVisible, 
  progress = 0, 
  onClose,
  filename = "video.mp4" 
}) => {
  const [particles, setParticles] = useState([]);
  const [displayProgress, setDisplayProgress] = useState(0);

  // Smooth progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayProgress(prev => {
        const diff = progress - prev;
        if (Math.abs(diff) < 0.1) return progress;
        return prev + diff * 0.1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [progress]);

  // Particle creation
  const createParticle = () => {
    const id = Math.random();
    const particle = {
      id,
      x: Math.random() * 100,
      y: 50 + Math.random() * 30,
      size: Math.random() * 2 + 2,
      color: ['#3b82f6', '#1e40af', '#60a5fa', '#93c5fd'][Math.floor(Math.random() * 4)],
      duration: Math.random() * 1000 + 1500,
      randomX: (Math.random() - 0.5) * 60
    };

    setParticles(prev => [...prev, particle]);

    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
    }, particle.duration);
  };

  // Ambient particles
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        createParticle();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-[420px] h-[280px] p-8 overflow-hidden transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: `
              0 25px 45px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.15),
              inset 0 -1px 0 rgba(0, 0, 0, 0.3),
              0 0 30px rgba(59, 130, 246, 0.1)
            `
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 hover:scale-110"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            {particles.map(particle => (
              <motion.div
                key={particle.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  background: particle.color,
                  boxShadow: `0 0 6px ${particle.color}`
                }}
                initial={{ 
                  y: 20, 
                  x: 0, 
                  scale: 0, 
                  opacity: 0 
                }}
                animate={{
                  y: [-20, -40],
                  x: [0, particle.randomX],
                  scale: [0, 1, 1, 0],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: particle.duration / 1000,
                  ease: "easeOut",
                  times: [0, 0.2, 0.8, 1]
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
            {/* Icon */}
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
              }}
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  '0 8px 32px rgba(59, 130, 246, 0.3)',
                  '0 12px 40px rgba(59, 130, 246, 0.4)',
                  '0 8px 32px rgba(59, 130, 246, 0.3)'
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </motion.div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-white mb-2" style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)' }}>
              Creating Video
            </h3>

            {/* Subtitle */}
            <p className="text-sm text-white/70 mb-8 leading-relaxed">
              Combining your audio and image files<br />
              into a beautiful video experience
            </p>

            {/* Progress Bar */}
            <div 
              className="relative w-full h-1.5 mb-4 rounded-full overflow-hidden cursor-pointer"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              onMouseEnter={createParticle}
            >
              <motion.div
                className="h-full rounded-full relative"
                style={{
                  background: 'linear-gradient(90deg, #3b82f6 0%, #1e40af 50%, #3b82f6 100%)',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
                }}
                animate={{ width: `${displayProgress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)'
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            </div>

            {/* Progress Text */}
            <div className="text-xs text-white/60 font-medium">
              {displayProgress >= 100 ? 'Video Ready! ✨' : `Processing... ${Math.floor(displayProgress)}%`}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlassmorphismVideoLoader;
