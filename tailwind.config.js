/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nord: {
          0: '#2e3440',
          1: '#3b4252',
          2: '#434c5e',
          3: '#4c566a',
          4: '#d8dee9',
          5: '#e5e9f0',
          6: '#eceff4',
          7: '#8fbcbb',
          8: '#88c0d0',
          9: '#81a1c1',
          10: '#5e81ac',
          11: '#bf616a',
          12: '#d08770',
          13: '#ebcb8b',
          14: '#a3be8c',
          15: '#b48ead',
        },
        background: {
          darker: '#1e222a', // Deep Nordic Obsidian
          dark: '#2e3440',   // Classic Nord
          light: '#3b4252',
        },
        accent: {
          frost: '#88c0d0',
          teal: '#8fbcbb',
          blue: '#81a1c1',
          purple: '#b48ead',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
