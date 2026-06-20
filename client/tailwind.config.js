/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        pearl: '#f8f5ef',
        rose: '#be3455',
        gold: '#c5974a',
        sage: '#6f8f72'
      },
      boxShadow: {
        glow: '0 24px 80px rgba(190, 52, 85, 0.22)'
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
};
