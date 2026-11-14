import { createGlobalStyle } from 'styled-components';
import { media } from './tokens';

/**
 * Visual do tutorial (driver.js) com os tokens do Stokar.
 * O driver.js desenha o balão fora da árvore do React, então o estilo é global,
 * restrito à classe `stokar-tour` (popoverClass).
 */
export const TourStyle = createGlobalStyle`
  .driver-popover.stokar-tour {
    min-width: 280px;
    max-width: 380px;
    padding: ${({ theme }) => theme.space(5)};
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    box-shadow: ${({ theme }) => theme.shadow.pop};
    font-family: ${({ theme }) => theme.font.body};

    ${media.mobile} {
      max-width: calc(100vw - 24px);
    }

    .driver-popover-title {
      font-family: ${({ theme }) => theme.font.display};
      font-size: ${({ theme }) => theme.fontSize.xl};
      font-weight: ${({ theme }) => theme.fontWeight.semibold};
      line-height: 1.2;
      padding-right: ${({ theme }) => theme.space(6)};
    }

    .driver-popover-description {
      margin-top: ${({ theme }) => theme.space(2)};
      font-size: ${({ theme }) => theme.fontSize.md};
      line-height: 1.5;
      color: ${({ theme }) => theme.colors.textMuted};

      b { color: ${({ theme }) => theme.colors.text}; font-weight: ${({ theme }) => theme.fontWeight.semibold}; }
    }

    .driver-popover-close-btn {
      top: ${({ theme }) => theme.space(3)};
      right: ${({ theme }) => theme.space(3)};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      color: ${({ theme }) => theme.colors.textSubtle};
      font-size: 20px;
      transition: background ${({ theme }) => theme.transition}, color ${({ theme }) => theme.transition};

      &:hover, &:focus { background: ${({ theme }) => theme.colors.surfaceInset}; color: ${({ theme }) => theme.colors.text}; }
    }

    .driver-popover-footer {
      margin-top: ${({ theme }) => theme.space(5)};
      gap: ${({ theme }) => theme.space(2)};
      flex-wrap: wrap;
    }

    .driver-popover-progress-text {
      font-size: ${({ theme }) => theme.fontSize.xs};
      font-weight: ${({ theme }) => theme.fontWeight.semibold};
      color: ${({ theme }) => theme.colors.textSubtle};
      letter-spacing: 0.02em;
    }

    .driver-popover-navigation-btns {
      gap: ${({ theme }) => theme.space(2)};
    }

    .driver-popover-navigation-btns button,
    .stokar-tour-skip {
      height: 38px;
      padding: 0 ${({ theme }) => theme.space(4)};
      margin: 0;
      border-radius: ${({ theme }) => theme.radius.pill};
      font-family: inherit;
      font-size: ${({ theme }) => theme.fontSize.sm};
      font-weight: ${({ theme }) => theme.fontWeight.semibold};
      text-shadow: none;
      cursor: pointer;
      transition: background ${({ theme }) => theme.transition}, border-color ${({ theme }) => theme.transition};
    }

    .driver-popover-prev-btn {
      background: transparent;
      color: ${({ theme }) => theme.colors.text};
      border: 1px solid ${({ theme }) => theme.colors.borderStrong};

      &:hover, &:focus { background: ${({ theme }) => theme.colors.surfaceInset}; }
    }

    .driver-popover-next-btn {
      background: ${({ theme }) => theme.colors.primary};
      color: ${({ theme }) => theme.colors.primaryFg};
      border: 1px solid ${({ theme }) => theme.colors.primary};

      &:hover, &:focus { background: ${({ theme }) => theme.colors.primaryHover}; border-color: ${({ theme }) => theme.colors.primaryHover}; }
    }

    .driver-popover-btn-disabled { display: none !important; }

    .stokar-tour-skip {
      order: -1;
      margin-right: auto;
      padding: 0 ${({ theme }) => theme.space(1)};
      background: none;
      border: 0;
      color: ${({ theme }) => theme.colors.textSubtle};

      &:hover, &:focus { color: ${({ theme }) => theme.colors.text}; text-decoration: underline; }
    }

    /* Com o "Pular" no rodapé, o contador vai para o topo do balão */
    .driver-popover-footer:has(.stokar-tour-skip) .driver-popover-progress-text {
      flex-basis: 100%;
      order: -2;
    }

    button:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.primary};
      outline-offset: 2px;
    }

    /* Setinha do balão na cor da superfície (o padrão do driver.js é branco) */
    .driver-popover-arrow-side-left { border-left-color: ${({ theme }) => theme.colors.surface}; }
    .driver-popover-arrow-side-right { border-right-color: ${({ theme }) => theme.colors.surface}; }
    .driver-popover-arrow-side-top { border-top-color: ${({ theme }) => theme.colors.surface}; }
    .driver-popover-arrow-side-bottom { border-bottom-color: ${({ theme }) => theme.colors.surface}; }
  }

  /* Elemento destacado: borda laranja da marca */
  .driver-active-element {
    outline: 2px solid ${({ theme }) => theme.colors.primary} !important;
    outline-offset: 2px;
  }

  ${media.reducedMotion} {
    .driver-popover.stokar-tour { animation: none; }
  }
`;
