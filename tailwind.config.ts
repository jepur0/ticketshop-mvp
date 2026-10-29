import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#f4efe6',
          soft: '#faf7f2',
          card: '#fffdf9'
        },
        ink: {
          DEFAULT: '#17151a',
          soft: '#5c574f',
          muted: '#8a847a'
        },
        line: {
          DEFAULT: 'rgba(23,21,26,0.10)',
          strong: 'rgba(23,21,26,0.16)'
        },
        night: {
          DEFAULT: '#0d0e10',
          elev: '#16181c',
          line: 'rgba(255,255,255,0.08)'
        },
        gold: {
          DEFAULT: '#c89a3c',
          soft: '#e8d5a3',
          deep: '#8a6820'
        },
        accent: {
          DEFAULT: '#c2f64b',
          ink: '#111315'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 1px 2px rgba(23,21,26,.04), 0 10px 28px rgba(23,21,26,.06)',
        lift: '0 8px 30px rgba(23,21,26,.10)',
        glow: '0 0 0 1px rgba(200,154,60,.25), 0 12px 40px rgba(200,154,60,.12)'
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      maxWidth: {
        content: '72rem'
      }
    }
  },
  plugins: []
} satisfies Config
