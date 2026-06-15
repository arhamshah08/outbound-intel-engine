import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        'primary-dark': '#4F46E5',
        'primary-surface': '#EEF2FF',
        surface: '#F8F9FC',
        'surface-low': '#F1F5F9',
        'surface-container': '#E2E8F0',
        'on-surface': '#0F172A',
        'on-surface-variant': '#64748B',
        outline: '#94A3B8',
        'outline-variant': '#E2E8F0',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,0.06), 0 4px 20px rgba(15,23,42,0.04)',
        'card-hover': '0 4px 12px rgba(15,23,42,0.10), 0 8px 32px rgba(15,23,42,0.08)',
        'glow-primary': '0 0 24px rgba(99,102,241,0.25)',
        'glow-green': '0 0 24px rgba(16,185,129,0.25)',
      },
    },
  },
  plugins: [],
}
export default config
