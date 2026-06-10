/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        accent: {
          blue: '#3b82f6',
          orange: '#f97316',
          red: '#ef4444',
        },
        dark: {
          bg: '#0d0d0d',
          card: '#1a1a1a',
          border: '#2a2a2a',
          text: '#e5e5e5',
          muted: '#a3a3a3',
        },
      },
    },
  },
  plugins: [],
}

