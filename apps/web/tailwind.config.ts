import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        surface: 'hsl(var(--surface))',
        'surface-raised': 'hsl(var(--surface-raised))',
        'surface-overlay': 'hsl(var(--surface-overlay))',
        foreground: 'hsl(var(--foreground))',
        'foreground-muted': 'hsl(var(--foreground-muted))',
        'foreground-subtle': 'hsl(var(--foreground-subtle))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          muted: 'hsl(var(--primary-muted))',
        },
        risk: {
          normal: 'hsl(var(--risk-normal))',
          'normal-bg': 'hsl(var(--risk-normal-bg))',
          'normal-border': 'hsl(var(--risk-normal-border))',
          soft: 'hsl(var(--risk-soft))',
          'soft-bg': 'hsl(var(--risk-soft-bg))',
          'soft-border': 'hsl(var(--risk-soft-border))',
          hard: 'hsl(var(--risk-hard))',
          'hard-bg': 'hsl(var(--risk-hard-bg))',
          'hard-border': 'hsl(var(--risk-hard-border))',
          blocked: 'hsl(var(--risk-blocked))',
          'blocked-bg': 'hsl(var(--risk-blocked-bg))',
          'blocked-border': 'hsl(var(--risk-blocked-border))',
        },
        border: 'hsl(var(--border))',
        'border-strong': 'hsl(var(--border-strong))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        status: {
          pending: 'hsl(var(--status-pending))',
          active: 'hsl(var(--status-active))',
          completed: 'hsl(var(--status-completed))',
          overdue: 'hsl(var(--status-overdue))',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
    },
  },
  plugins: [],
};

export default config;
