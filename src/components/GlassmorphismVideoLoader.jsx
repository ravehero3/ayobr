
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
      color: ['#ffffff', '#e0f2fe', '#b3e5fc', '#81d4fa'][Math.floor(Math.random() * 4)],
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
          className="glassmorphism-video-loader relative w-[400px] h-[200px] p-8 overflow-visible transition-all duration-300 cursor-pointer"
          style={{
            background: 'rgba(0, 0, 0, 0.44)',
            backdropFilter: 'blur(11.4px)',
            WebkitBackdropFilter: 'blur(11.4px)',
            borderRadius: '16px',
            border: '1px solid rgba(0, 0, 0, 0.09)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.boxShadow = `
              0 4px 30px rgba(0, 0, 0, 0.1),
              0 0 40px rgba(19, 0, 255, 0.3),
              0 0 80px rgba(79, 172, 254, 0.2)
            `;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.44)';
            e.currentTarget.style.border = '1px solid rgba(0, 0, 0, 0.09)';
            e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
          }}
        >
          {/* Close Button */}
          <div
            className="absolute top-4 right-4 w-5 h-5 opacity-0 transition-opacity duration-300 cursor-pointer hover:opacity-100 close-btn"
            onClick={onClose}
            style={{
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div 
              className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-black transform -translate-x-1/2 -translate-y-1/2 rotate-45"
            />
            <div 
              className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-black transform -translate-x-1/2 -translate-y-1/2 -rotate-45"
            />
          </div>

          {/* Enhanced Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {/* Static particles that activate on hover */}
            {[...Array(7)].map((_, i) => (
              <motion.div
                key={`static-${i}`}
                className="static-particles absolute rounded-full pointer-events-none"
                style={{
                  width: '3px',
                  height: '3px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 0 6px rgba(255, 255, 255, 0.6)',
                  left: `${12 + (i * 12)}%`,
                  top: `${-10 + (i % 3) * 15}px`,
                  opacity: 0,
                  zIndex: 1000,
                  transition: 'opacity 0.3s ease'
                }}
                animate={{
                  opacity: [0, 0.8, 0.5, 0.9, 0.3],
                  x: [0, Math.random() * 60 - 30, Math.random() * 60 - 30, 0],
                  y: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
                  scale: [0.5, 1.2, 0.7, 1, 0.5]
                }}
                transition={{
                  duration: 20 + Math.random() * 5,
                  repeat: Infinity,
                  delay: i * 3,
                  ease: "easeInOut"
                }}
              />
            ))}
            
            {/* Dynamic particles */}
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
          <div className="flex flex-col h-full text-left relative z-10">
            {/* Title */}
            <h3 className="text-lg font-semibold text-white mb-2" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
              {filename.replace('.mp4', '').replace('video_', '').replace(/_/g, ' ')}
            </h3>

            {/* Subtitle */}
            <p className="text-sm text-white/80 mb-8" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>
              Creating your video...
            </p>

            {/* Progress Bar */}
            <div 
              className="relative w-full h-2 mb-4 rounded-full overflow-visible mt-auto"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              onMouseEnter={createParticle}
            >
              <motion.div
                className="h-full rounded-full relative transition-all duration-300"
                style={{
                  background: displayProgress > 0 ? 'linear-gradient(90deg, #1300ff 0%, #4facfe 100%)' : '#333',
                  boxShadow: displayProgress > 0 ? `
                    0 0 20px rgba(19, 0, 255, 0.25),
                    0 0 40px rgba(19, 0, 255, 0.15),
                    inset 0 2px 4px rgba(255, 255, 255, 0.2),
                    inset 0 -2px 4px rgba(0, 0, 0, 0.2)
                  ` : 'none'
                }}
                animate={{ width: `${displayProgress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Enhanced particles on progress bar */}
                {displayProgress > 0 && [...Array(7)].map((_, i) => (
                  <motion.div
                    key={`progress-particle-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: '3px',
                      height: '3px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      boxShadow: '0 0 6px rgba(255, 255, 255, 0.6)',
                      left: `${15 + (i * 12)}%`,
                      top: `${-10 + (i % 3) * 15}px`,
                      zIndex: 1000
                    }}
                    animate={{
                      opacity: [0.3, 0.8, 0.5, 0.9, 0.3],
                      x: [0, Math.random() * 60 - 30, Math.random() * 60 - 30, 0],
                      y: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
                      scale: [0.5, 1.2, 0.7, 1, 0.5]
                    }}
                    transition={{
                      duration: 20 + Math.random() * 5,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlassmorphismVideoLoader;
