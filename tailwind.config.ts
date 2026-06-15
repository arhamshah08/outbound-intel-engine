import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Legacy custom tokens (keep for existing components)
      colors: {
        // shadcn semantic tokens (map to CSS variables)
        background:  'var(--background)',
        foreground:  'var(--foreground)',
        border:      'var(--border)',
        input:       'var(--input)',
        ring:        'var(--ring)',
        primary: {
          DEFAULT:    'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT:    'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT:    'var(--destructive)',
          foreground: 'var(--destructive-foreground, oklch(0.985 0 0))',
        },
        muted: {
          DEFAULT:    'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT:    'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT:    'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT:    'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        sidebar: {
          DEFAULT:               'var(--sidebar)',
          foreground:            'var(--sidebar-foreground)',
          primary:               'var(--sidebar-primary)',
          'primary-foreground':  'var(--sidebar-primary-foreground)',
          accent:                'var(--sidebar-accent)',
          'accent-foreground':   'var(--sidebar-accent-foreground)',
          border:                'var(--sidebar-border)',
          ring:                  'var(--sidebar-ring)',
        },
        // Legacy tokens from the original design
        'primary-dark':           '#292524',   // warm charcoal (was indigo)
        'primary-surface':        '#F0EDE8',   // warm off-white
        surface:                  '#F0EDE8',
        'surface-low':            '#EDEAE5',
        'surface-container':      '#E2DDD7',
        'on-surface':             '#1C1917',
        'on-surface-variant':     '#78716C',
        outline:                  '#A8A29E',
        'outline-variant':        '#E2DDD7',
        success:                  '#16A34A',
        warning:                  '#D97706',
        error:                    '#DC2626',
      },
      borderRadius: {
        lg:  'var(--radius)',
        md:  'calc(var(--radius) - 2px)',
        sm:  'calc(var(--radius) - 4px)',
        xl:  'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:           '0 1px 3px rgba(15,23,42,0.06), 0 4px 20px rgba(15,23,42,0.04)',
        'card-hover':   '0 4px 12px rgba(15,23,42,0.10), 0 8px 32px rgba(15,23,42,0.08)',
        'glow-primary': '0 0 24px rgba(99,102,241,0.25)',
        'glow-green':   '0 0 24px rgba(16,185,129,0.25)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'collapsible-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-collapsible-content-height)' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to:   { height: '0' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down':  'accordion-down 0.2s ease-out',
        'accordion-up':    'accordion-up 0.2s ease-out',
        'collapsible-down':'collapsible-down 0.2s ease-out',
        'collapsible-up':  'collapsible-up 0.2s ease-out',
        'slide-in':        'slide-in 0.25s ease-out forwards',
      },
    },
  },
  plugins: [],
}
export default config
