/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Space/Dark theme colors
        'space-black': '#050A13',
        'space-dark': '#0A0F1C',
        'space-navy': '#0F1419',
        
        // Neon colors
        'neon-blue': '#1E90FF',
        'neon-cyan': '#00CFFF',
        'neon-purple': '#8A2BE2',
        'neon-pink': '#FF1493',
        
        // Grayscale with blue tints
        'gray-850': '#1a1f2e',
        'gray-750': '#252d3d',
        'gray-650': '#374151',
      },
      
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      
      boxShadow: {
        'neon': '0 0 20px rgba(30, 144, 255, 0.3)',
        'neon-lg': '0 0 30px rgba(30, 144, 255, 0.4)',
        'neon-xl': '0 0 40px rgba(30, 144, 255, 0.5)',
        'cyan': '0 0 20px rgba(0, 207, 255, 0.3)',
        'cyan-lg': '0 0 30px rgba(0, 207, 255, 0.4)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      
      backdropBlur: {
        'xs': '2px',
      },
      
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'diagonal-move': 'diagonalMove 20s linear infinite',
      },
      
      keyframes: {
        glow: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(30, 144, 255, 0.3)' 
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(30, 144, 255, 0.6)' 
          },
        },
        shimmer: {
          '0%': { 
            backgroundPosition: '-1000px 0' 
          },
          '100%': { 
            backgroundPosition: '1000px 0' 
          },
        },
        float: {
          '0%, 100%': { 
            transform: 'translateY(0px)' 
          },
          '50%': { 
            transform: 'translateY(-10px)' 
          },
        },
        diagonalMove: {
          '0%': { 
            transform: 'translate(-20%, -20%) scale(1.2)',
          },
          '25%': { 
            transform: 'translate(-10%, -10%) scale(1.2)',
          },
          '50%': { 
            transform: 'translate(0%, 0%) scale(1.2)',
          },
          '75%': { 
            transform: 'translate(-10%, -10%) scale(1.2)',
          },
          '100%': { 
            transform: 'translate(-20%, -20%) scale(1.2)',
          },
        },
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      aspectRatio: {
        'video': '16 / 9',
        'square': '1 / 1',
        'portrait': '3 / 4',
      },
      
      gridTemplateColumns: {
        'auto-fit-xs': 'repeat(auto-fit, minmax(200px, 1fr))',
        'auto-fit-sm': 'repeat(auto-fit, minmax(250px, 1fr))',
        'auto-fit-md': 'repeat(auto-fit, minmax(300px, 1fr))',
        'auto-fit-lg': 'repeat(auto-fit, minmax(400px, 1fr))',
      },
      
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    // Custom plugin for glass morphism utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.glass': {
          background: 'rgba(10, 15, 28, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(30, 144, 255, 0.2)',
        },
        '.glass-strong': {
          background: 'rgba(10, 15, 28, 0.9)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(30, 144, 255, 0.3)',
        },
        '.neon-border': {
          border: '1.5px solid #1E90FF',
          boxShadow: '0 0 10px rgba(30, 144, 255, 0.3)',
        },
        '.neon-border-cyan': {
          border: '1.5px solid #00CFFF',
          boxShadow: '0 0 10px rgba(0, 207, 255, 0.3)',
        },
        '.glass-card': {
          backdropFilter: 'blur(16px)',
          background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.3) 0%, rgba(30, 144, 255, 0.3) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          padding: '1.5rem',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
