import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Slidebook's visual language: ivory paper, carved-wood warmth, and soft
 * brown ink. Keeping these tokens in one place makes it easy for screens to
 * feel related without sharing large style sheets.
 */
export const colors = {
  canvas: '#F7EFE3',
  surface: '#FFF9EF',
  surfaceRaised: '#FFFCF7',
  surfaceMuted: '#EFE0CD',
  ink: '#342417',
  inkMuted: '#6E5A45',
  inkSubtle: '#8A7560',
  violet: '#B87732',
  violetDark: '#75461F',
  violetSoft: '#EBCFA8',
  violetWash: '#FFF0D8',
  blush: '#EFCDB3',
  sage: '#C7D1BC',
  amber: '#D69A45',
  border: '#E3D0BB',
  white: '#FFFFFF',
  success: '#557049',
  danger: '#A94E3D',
  overlay: 'rgba(52, 36, 23, 0.42)',
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
