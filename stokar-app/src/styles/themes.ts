import { fonts, fontSize, palette, radius, space, touch } from './tokens';

const base = { fonts, fontSize, radius, space, touch };

export type ThemeMode = 'light' | 'dark';

const lightColors = {
  bg: palette.steel[100],
  surface: palette.steel[0],
  surfaceAlt: palette.steel[50],
  surfaceInset: '#ECEEF1',
  border: palette.steel[200],
  borderStrong: palette.steel[300],
  text: '#181D23',
  textMuted: palette.steel[600],
  textSubtle: palette.steel[500],

  primary: palette.orange[500],
  primaryPressed: palette.orange[600],
  /** texto sobre o laranja: grafite quente, como em placas de segurança */
  primaryFg: palette.ink,
  primarySoft: palette.orange[100],
  primaryText: palette.orange[700],

  success: '#1F7A4A',
  successSoft: '#DDF3E6',
  warning: '#8A6500',
  warningSoft: '#FFF1C2',
  danger: '#C0341F',
  dangerSoft: '#FBE1DC',
  info: '#23648F',
  infoSoft: '#DCECF6',

  overlay: 'rgba(16, 20, 24, 0.55)',
};

export type ThemeColors = Record<keyof typeof lightColors, string>;

export type AppTheme = typeof base & { mode: ThemeMode; colors: ThemeColors };

export const lightTheme: AppTheme = { ...base, mode: 'light', colors: lightColors };

export const darkTheme: AppTheme = {
  ...base,
  mode: 'dark',
  colors: {
    bg: palette.steel[950],
    surface: palette.steel[850],
    surfaceAlt: palette.steel[800],
    surfaceInset: palette.steel[900],
    border: '#2C343D',
    borderStrong: '#3F4954',
    text: '#F1F3F5',
    textMuted: '#A9B2BC',
    textSubtle: '#8893A0',

    primary: palette.orange[400],
    primaryPressed: '#FF9647',
    primaryFg: palette.ink,
    primarySoft: palette.orange[900],
    primaryText: palette.orange[300],

    success: '#5FCB8E',
    successSoft: '#143324',
    warning: '#F5C83A',
    warningSoft: '#3A2F0C',
    danger: '#FF7D6B',
    dangerSoft: '#401914',
    info: '#6FB6E3',
    infoSoft: '#13303F',

    overlay: 'rgba(0, 0, 0, 0.65)',
  },
};

export const themes: Record<ThemeMode, AppTheme> = { light: lightTheme, dark: darkTheme };
