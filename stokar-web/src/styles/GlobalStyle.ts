import { createGlobalStyle } from 'styled-components';
import { media } from './tokens';

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }

  html { -webkit-text-size-adjust: 100%; }

  body {
    margin: 0;
    min-height: 100dvh;
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.font.body};
    font-size: ${({ theme }) => theme.fontSize.md};
    line-height: 1.45;
    -webkit-font-smoothing: antialiased;
    color-scheme: ${({ theme }) => theme.mode};
    transition: background ${({ theme }) => theme.transition}, color ${({ theme }) => theme.transition};
  }

  h1, h2, h3, h4, p { margin: 0; }
  h1, h2, h3 { font-family: ${({ theme }) => theme.font.display}; font-weight: 600; letter-spacing: 0.005em; }

  a { color: inherit; text-decoration: none; }
  button, input, select, textarea { font: inherit; color: inherit; }
  button { cursor: pointer; }
  ul, ol { margin: 0; padding: 0; list-style: none; }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  ::selection { background: ${({ theme }) => theme.colors.primary}; color: ${({ theme }) => theme.colors.primaryFg}; }

  /* Toasts (sonner) seguindo o tema */
  [data-sonner-toaster] {
    --normal-bg: ${({ theme }) => theme.colors.surface};
    --normal-text: ${({ theme }) => theme.colors.text};
    --normal-border: ${({ theme }) => theme.colors.border};
    --border-radius: ${({ theme }) => theme.radius.md};
    font-family: ${({ theme }) => theme.font.body};
  }

  ${media.reducedMotion} {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
