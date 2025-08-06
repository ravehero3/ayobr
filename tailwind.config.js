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
        
        // Blue accent colors
        'neon-blue': '#60A5FA',
        'neon-cyan': '#60A5FA',
        'neon-purple': '#60A5FA',
        'neon-pink': '#60A5FA',
        
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
        'neon': '0 0 20px rgba(96, 165, 250, 0.3)',
        'neon-lg': '0 0 30px rgba(96, 165, 250, 0.4)',
        'neon-xl': '0 0 40px rgba(96, 165, 250, 0.5)',
        'cyan': '0 0 20px rgba(96, 165, 250, 0.3)',
        'cyan-lg': '0 0 30px rgba(96, 165, 250, 0.4)',
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
        'diagonal-move': 'diagonalMove 25s ease-in-out infinite',
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
            transform: 'translate(-15%, -15%) scale(1.15)',
          },
          '25%': { 
            transform: 'translate(-5%, -8%) scale(1.18)',
          },
          '50%': { 
            transform: 'translate(5%, 2%) scale(1.15)',
          },
          '75%': { 
            transform: 'translate(-8%, -5%) scale(1.18)',
          },
          '100%': { 
            transform: 'translate(-15%, -15%) scale(1.15)',
          },
        },
      },
      
      fontSize: {
        // Custom font sizes for app typography rules
        'main-title': ['32px', { lineHeight: '1.2', fontWeight: '700' }],    // Main Title/Headline
        'section-title': ['22px', { lineHeight: '1.3', fontWeight: '600' }], // Section Titles/Headers
        'button-primary': ['18px', { lineHeight: '1.4', fontWeight: '500' }], // Primary Action Buttons
        'button-secondary': ['16px', { lineHeight: '1.4', fontWeight: '500' }], // Secondary Buttons
        'body-text': ['16px', { lineHeight: '1.5', fontWeight: '400' }],     // Body Text/Labels
        'small-notes': ['13px', { lineHeight: '1.4', fontWeight: '400' }],   // Small Notes/Footnotes
        'ui-tooltips': ['12px', { lineHeight: '1.3', fontWeight: '400' }],   // Icons/Tabs/UI Tooltips
      },
      
      spacing: {
        // 4-point grid spacing system (multiples of 4px)
        '1': '4px',    // 1 unit = 4px
        '2': '8px',    // 2 units = 8px
        '3': '12px',   // 3 units = 12px
        '4': '16px',   // 4 units = 16px
        '5': '20px',   // 5 units = 20px
        '6': '24px',   // 6 units = 24px
        '7': '28px',   // 7 units = 28px
        '8': '32px',   // 8 units = 32px
        '9': '36px',   // 9 units = 36px
        '10': '40px',  // 10 units = 40px
        '12': '48px',  // 12 units = 48px
        '16': '64px',  // 16 units = 64px
        '20': '80px',  // 20 units = 80px
        '24': '96px',  // 24 units = 96px
        '32': '128px', // 32 units = 128px
        
        // Legacy spacing (keeping for compatibility)
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
          border: '1px solid rgba(96, 165, 250, 0.2)',
        },
        '.glass-strong': {
          background: 'rgba(10, 15, 28, 0.9)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(96, 165, 250, 0.3)',
        },
        '.neon-border': {
          border: '1.5px solid #60A5FA',
          boxShadow: '0 0 10px rgba(96, 165, 250, 0.3)',
        },
        '.neon-border-cyan': {
          border: '1.5px solid #60A5FA',
          boxShadow: '0 0 10px rgba(96, 165, 250, 0.3)',
        },
        '.glass-card': {
          backdropFilter: 'blur(16px)',
          background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.3) 0%, rgba(96, 165, 250, 0.3) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          padding: '1.5rem',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
