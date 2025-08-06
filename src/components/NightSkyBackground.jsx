import React, { useEffect, useRef } from 'react';
import './NightSkyBackground.css';

class NightSkyController {
  constructor(container) {
    this.container = container;
    this.stars = [];
    this.constellations = [];
    this.mouse = { x: 0, y: 0 };
    this.init();
  }

  init() {
    this.createStars();
    this.bindEvents();
    this.animate();
  }

  createStars() {
    // Create bright stars with cross glow - 6x more stars (72 instead of 12)
    for (let i = 0; i < 72; i++) {
      const star = document.createElement('div');
      star.className = 'bright-star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      this.container.appendChild(star);
      this.stars.push({
        element: star,
        x: parseFloat(star.style.left),
        y: parseFloat(star.style.top),
        speed: 0.02 + Math.random() * 0.03
      });
    }
  }

  createConstellations() {
    // No constellation lines - just pure darkness and stars
    return;
  }

  bindEvents() {
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  animate() {
    this.stars.forEach(star => {
      const parallaxX = this.mouse.x * star.speed * 20;
      const parallaxY = this.mouse.y * star.speed * 20;
      star.element.style.transform = `translate(${parallaxX}px, ${parallaxY}px)`;
    });

    requestAnimationFrame(() => this.animate());
  }
}

const NightSkyBackground = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const nightSky = new NightSkyController(containerRef.current);
      
      return () => {
        // Cleanup
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      };
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="night-sky"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        overflow: 'hidden'
      }}
    >
      <div className="stars-layer-1"></div>
      <div className="stars-layer-2"></div>
      <div className="stars-layer-3"></div>
    </div>
  );
};

export default NightSkyBackground;