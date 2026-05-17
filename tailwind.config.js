/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Pure black/dark theme
        'space-black': '#000000',
        'space-dark': '#000000',
        'space-navy': '#050505',
        
        // Gray accent colors (monochrome)
        'neon-blue': '#ffffff',
        'neon-cyan': '#ffffff',
        'neon-purple': '#ffffff',
        'neon-pink': '#ffffff',
        
        // Grayscale (monochrome)
        'gray-850': '#111111',
        'gray-750': '#1a1a1a',
        'gray-650': '#262626',
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
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'diagonal-move': 'diagonalMove 25s ease-in-out infinite',
      },
      
      keyframes: {
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
          background: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-strong': {
          background: 'rgba(5, 5, 5, 0.9)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        },
        '.neon-border': {
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
        },
        '.neon-border-cyan': {
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
        },
        '.glass-card': {
          backdropFilter: 'blur(16px)',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          padding: '1.5rem',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
