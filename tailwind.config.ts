import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['"DM Sans"', 'PingFang SC', 'Hiragino Sans GB', 'sans-serif'],
      },
      colors: {
        r: {
          bg:     '#0B0B12',
          card:   '#111120',
          border: '#1C1C30',
          dim:    '#252540',
          muted:  '#5A5A78',
          faint:  '#9090A8',
          text:   '#E8E6F0',
          accent: '#E8A020',
        },
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
