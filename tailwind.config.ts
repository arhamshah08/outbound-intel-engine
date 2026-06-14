import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        'primary-dark': '#1D4ED8',
        surface: '#F8FAFC',
        'surface-low': '#F0F5FF',
        'surface-container': '#E8EFFF',
        'on-surface': '#0F172A',
        'on-surface-variant': '#374151',
        outline: '#6B7280',
        'outline-variant': '#CBD5E1',
        success: '#16A34A',
        warning: '#D97706',
        error: '#DC2626',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0px 1px 4px rgba(15,23,42,0.06), 0px 4px 16px rgba(15,23,42,0.04)',
        'card-hover': '0px 4px 12px rgba(15,23,42,0.08), 0px 8px 32px rgba(15,23,42,0.08)',
      },
    },
  },
  plugins: [],
}
export default config
