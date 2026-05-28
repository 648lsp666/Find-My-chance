import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['"DM Sans"', 'PingFang SC', 'Hiragino Sans GB', 'sans-serif'],
      },
      colors: {
        r: {
          bg:     'rgb(var(--r-bg) / <alpha-value>)',
          card:   'rgb(var(--r-card) / <alpha-value>)',
          border: 'rgb(var(--r-border) / <alpha-value>)',
          dim:    'rgb(var(--r-dim) / <alpha-value>)',
          muted:  'rgb(var(--r-muted) / <alpha-value>)',
          faint:  'rgb(var(--r-faint) / <alpha-value>)',
          text:   'rgb(var(--r-text) / <alpha-value>)',
          body:   'rgb(var(--r-body) / <alpha-value>)',
          accent: 'rgb(var(--r-accent) / <alpha-value>)',
          time:   'rgb(var(--r-time) / <alpha-value>)',
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
