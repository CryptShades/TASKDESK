export const theme = {
  colors: {
    background: '#0F1115',
    surface: '#171A21',
    surfaceRaised: '#1E222A',
    foreground: '#F5F7FA',
    foregroundMuted: '#9CA3AF',
    primary: '#4F46E5',
    riskNormal: '#1EB980',
    riskSoft: '#F5A623',
    riskHard: '#E5484D',
    riskBlocked: '#8B5CF6',
    border: '#2A2F38',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  typography: {
    h1: {
      fontSize: 28,
      fontWeight: '600' as const,
      lineHeight: 36,
    },
    h2: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    h3: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 22,
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    label: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
    },
    small: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
    },
    badge: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 16,
    },
    numbers: {
      fontVariant: ['tabular-nums'] as any,
    },
  },
  roundness: {
    sm: 8,
    md: 10,
    lg: 16,
    xl: 16,
    full: 999,
  },
};
