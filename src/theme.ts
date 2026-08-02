import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Slidebook's visual language: warm paper surfaces, plum ink, and a vivid
 * violet accent. Keeping these tokens in one place makes it easy for screens
 * to feel related without sharing large style sheets.
 */
export const colors = {
  canvas: '#F7F1E8',
  surface: '#FFFDF8',
  surfaceRaised: '#FFFFFF',
  surfaceMuted: '#EFE7DC',
  ink: '#251C2E',
  inkMuted: '#655B69',
  inkSubtle: '#756B78',
  violet: '#7351D6',
  violetDark: '#5135A5',
  violetSoft: '#E9E0FF',
  violetWash: '#F2ECFF',
  blush: '#F2C7C2',
  sage: '#B9CCB6',
  amber: '#E8B86B',
  border: '#E3D9CE',
  white: '#FFFFFF',
  success: '#39745A',
  danger: '#B9555E',
  overlay: 'rgba(37, 28, 46, 0.42)',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const typography = {
  display: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '700',
    letterSpacing: -1.4,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.25,
  },
} as const satisfies Record<string, TextStyle>;

export const shadows = {
  card: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 5,
  },
  floating: {
    shadowColor: colors.violetDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 7,
  },
} as const satisfies Record<string, ViewStyle>;

export const theme = {
  colors,
  spacing,
  radii,
  typography,
  shadows,
} as const;

export type Theme = typeof theme;
export type ThemeColor = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
