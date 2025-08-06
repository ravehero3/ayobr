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
    this.createConstellations();
    this.bindEvents();
    this.animate();
  }

  createStars() {
    // Create bright stars with cross glow
    for (let i = 0; i < 12; i++) {
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
    // Create constellation lines
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'constellation-lines');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.opacity = '0.3';

    // Create some constellation lines
    const lines = [
      { x1: '20%', y1: '30%', x2: '35%', y2: '25%' },
      { x1: '35%', y1: '25%', x2: '45%', y2: '40%' },
      { x1: '60%', y1: '20%', x2: '75%', y2: '35%' },
      { x1: '75%', y1: '35%', x2: '80%', y2: '50%' },
      { x1: '15%', y1: '70%', x2: '25%', y2: '85%' },
      { x1: '70%', y1: '75%', x2: '85%', y2: '80%' }
    ];

    lines.forEach(line => {
      const svgLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      svgLine.setAttribute('x1', line.x1);
      svgLine.setAttribute('y1', line.y1);
      svgLine.setAttribute('x2', line.x2);
      svgLine.setAttribute('y2', line.y2);
      svgLine.setAttribute('stroke', 'rgba(255, 255, 255, 0.4)');
      svgLine.setAttribute('stroke-width', '1');
      svg.appendChild(svgLine);
    });

    this.container.appendChild(svg);
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