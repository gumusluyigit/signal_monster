/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0d0d0d',
          surface: '#141414',
          elevated: '#1a1a1a',
          border: '#222222',
        },
        amber: {
          led: '#f97316',
          glow: '#fb923c',
          dim: '#7c3109',
          muted: '#3d1a08',
        },
        text: {
          primary: '#f0ece4',
          secondary: '#8a8070',
          muted: '#4a4540',
        }
      },
      fontFamily: {
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
        body: ['var(--font-body)'],
      },
      boxShadow: {
        'led': '0 0 8px #f97316, 0 0 24px #f9731640',
        'led-sm': '0 0 4px #f97316, 0 0 12px #f9731630',
        'led-lg': '0 0 12px #f97316, 0 0 40px #f9731650, 0 0 80px #f9731620',
      },
      animation: {
        'pulse-led': 'pulse-led 3s ease-in-out infinite',
        'flicker': 'flicker 8s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.3s ease',
      },
      keyframes: {
        'pulse-led': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 8px #f97316, 0 0 24px #f9731640' },
          '50%': { opacity: '0.7', boxShadow: '0 0 4px #f97316, 0 0 12px #f9731620' },
        },
        'flicker': {
          '0%, 95%, 100%': { opacity: '1' },
          '96%': { opacity: '0.8' },
          '97%': { opacity: '1' },
          '98%': { opacity: '0.7' },
          '99%': { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      }
    }
  },
  plugins: [],
}