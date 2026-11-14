/**
 * Design tokens do Stokar.
 *
 * Paleta pensada para almoxarifado/manutenção:
 * - laranja de segurança (cor da marca e das ações principais)
 * - aço/grafite (superfícies e texto)
 * - amarelo de sinalização, verde "liberado", vermelho "parada" e azul de planta técnica
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

export const typography = {
  family: {
    body: `'Barlow', system-ui, -apple-system, 'Segoe UI', sans-serif`,
    display: `'Barlow Semi Condensed', 'Barlow', system-ui, sans-serif`,
  },
  size: {
    xs: '0.75rem',
    sm: '0.8125rem',
    md: '0.9375rem',
    lg: '1.0625rem',
    xl: '1.375rem',
    '2xl': '1.75rem',
    '3xl': '2.375rem',
  },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
} as const;

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '18px',
  xl: '26px',
  pill: '999px',
} as const;

/** Escala de 4px: space(4) => 16px */
export const space = (n: number) => `${n * 4}px`;

export const zIndex = {
  nav: 20,
  overlay: 40,
  modal: 50,
  popover: 60,
  toast: 70,
} as const;

export const breakpoints = {
  /** até aqui: celular (barra de navegação inferior) */
  mobile: 767,
  /** até aqui: tablet (menu lateral só com ícones) */
  tablet: 1199,
} as const;

export const media = {
  mobile: `@media (max-width: ${breakpoints.mobile}px)`,
  tablet: `@media (max-width: ${breakpoints.tablet}px)`,
  tabletOnly: `@media (min-width: ${breakpoints.mobile + 1}px) and (max-width: ${breakpoints.tablet}px)`,
  desktop: `@media (min-width: ${breakpoints.tablet + 1}px)`,
  reducedMotion: `@media (prefers-reduced-motion: reduce)`,
} as const;
