/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        quest: {
          bg: '#0a0d14',
          surface: '#111827',
          card: '#1e293b',
          border: '#334155',
          primary: '#6366f1',
          accent: '#06b6d4',
          gold: '#f59e0b',
          success: '#10b981',
          danger: '#ef4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif']
      }
    },
  },
  plugins: [],
}
