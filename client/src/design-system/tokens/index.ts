export const tokens = {
  color: {
    primary: '#3730A3',
    primaryStrong: '#2F288E',
    primarySoft: '#EEF0FF',
    text: '#111827',
    textMuted: '#6B7280',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    sizes: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.08)',
    md: '0 4px 10px rgba(0,0,0,0.12)',
    lg: '0 10px 24px rgba(0,0,0,0.16)',
  },
  motion: {
    fast: '150ms',
    normal: '220ms',
    slow: '320ms',
  },
} as const;

export type DesignTokens = typeof tokens;
