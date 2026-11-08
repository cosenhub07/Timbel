export const colors = {
  background: '#060C20',
  surface: '#0F172A',
  card: '#1E293B',
  cardSecondary: '#243247',
  border: '#334155',
  borderLight: '#475569',
  
  // Brand colors
  primary: '#635BFF',
  primaryHover: '#7C75FF',
  primaryLight: 'rgba(99, 91, 255, 0.15)',
  
  // Status semantic colors
  free: '#10B981',       // Green (vacant/available)
  freeLight: 'rgba(16, 185, 129, 0.15)',
  soon: '#F59E0B',       // Amber (occupied soon / class ending soon)
  soonLight: 'rgba(245, 158, 11, 0.15)',
  busy: '#EF4444',       // Red (occupied)
  busyLight: 'rgba(239, 68, 68, 0.15)',
  
  // Text colors
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  
  // Overlay & accents
  overlay: 'rgba(6, 12, 32, 0.85)',
  glassCard: 'rgba(30, 41, 59, 0.75)',
  white: '#FFFFFF',
  black: '#000000',
  accentPink: '#EC4899',
  accentCyan: '#06B6D4',
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', color: colors.text },
  h2: { fontSize: 22, fontWeight: '700', color: colors.text },
  h3: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, fontWeight: '400', color: colors.text },
  bodySecondary: { fontSize: 14, fontWeight: '400', color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
  button: { fontSize: 16, fontWeight: '600', color: colors.white },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 9999,
};

