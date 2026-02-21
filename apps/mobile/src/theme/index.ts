export const theme = {
  colors: {
    background: '#0F1117',
    surface: '#13161E',
    surfaceRaised: '#181C26',
    foreground: '#DDE4EE',
    foregroundMuted: '#7A8499',
    primary: '#3B82F6',
    riskNormal: '#2D9E60',
    riskSoft: '#F5A623',
    riskHard: '#E53935',
    riskBlocked: '#9C6FE4',
    border: '#252B38',
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
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
    },
    h2: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    h3: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
    },
    numbers: {
      fontVariant: ['tabular-nums'] as any,
    },
  },
  roundness: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },
};
