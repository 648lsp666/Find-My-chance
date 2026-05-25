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
          bg:     '#F5F4FF',
          card:   '#FFFFFF',
          border: '#E5E3F5',
          dim:    '#C4B5FD',
          muted:  '#6B7280',
          faint:  '#9CA3AF',
          text:   '#1E1B4B',
          accent: '#7C3AED',
          time:   '#0D9488',
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
