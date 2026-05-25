import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'PingFang SC', 'Hiragino Sans GB', 'sans-serif'],
      },
      colors: {
        brand: '#5b50e8',
      },
    },
  },
  plugins: [],
}

export default config
