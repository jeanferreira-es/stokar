/**
 * Design tokens do Stokar — os mesmos do site (stokar-web/src/styles/tokens.ts),
 * em números (dp) em vez de rem/px.
 */
export const palette = {
  orange: {
    50: '#FFF4EA',
    100: '#FFE6D0',
    200: '#FFC797',
    300: '#FFA35C',
    400: '#FB8229',
    500: '#F26A0F',
    600: '#D95C09',
    700: '#A8400C',
    800: '#7C3110',
    900: '#3A2414',
  },
  steel: {
    0: '#FFFFFF',
    50: '#F4F5F7',
    100: '#E9ECEF',
    200: '#DDE1E5',
    300: '#C2C9D0',
    400: '#98A2AD',
    500: '#6E7A87',
    600: '#515C68',
    700: '#3A434D',
    800: '#212830',
    850: '#1A2027',
    900: '#151A20',
    950: '#101418',
  },
  ink: '#1A0E03',
  signalYellow: '#F2B705',
  releaseGreen: '#2F9E63',
  stopRed: '#D8402B',
  blueprint: '#2D7DB3',
} as const;

/** Nomes das fontes carregadas em App.tsx (@expo-google-fonts). */
export const fonts = {
  regular: 'Barlow_400Regular',
  medium: 'Barlow_500Medium',
  semibold: 'Barlow_600SemiBold',
  display: 'BarlowSemiCondensed_600SemiBold',
  displayBold: 'BarlowSemiCondensed_700Bold',
} as const;

export const fontSize = { xs: 12, sm: 13, md: 15, lg: 17, xl: 22, '2xl': 28 } as const;

export const radius = { sm: 8, md: 12, lg: 18, xl: 26, pill: 999 } as const;

/** Escala de 4dp: space(4) => 16 */
export const space = (n: number) => n * 4;

/** Altura mínima de toque recomendada */
export const touch = 48;
