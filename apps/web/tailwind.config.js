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
          bg: '#0d1410',
          secondary: '#17985d',
          supporting: '#6d6499',
          highlight: '#d2fcf8',
          white: '#ffffff',
          // semantic mapping
          surface: '#0d1410',
          card: '#0d1410',
          border: '#17985d',
          accent: '#17985d',
        }
      },
      fontFamily: {
        sans: ['"Cinzel Decorative"', 'serif', 'system-ui'],
        display: ['"Cinzel Decorative"', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        DEFAULT: '2px',
        'md': '2px',
        'lg': '2px',
        'xl': '2px',
        '2xl': '2px',
        '3xl': '2px',
        'full': '2px'
      }
    },
  },
  plugins: [],
}
