import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import type { Tone } from '@/models/labels';
import { media } from '@/styles/tokens';

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space(6)};

  ${media.tablet} { gap: ${({ theme }) => theme.space(4)}; }
  ${media.mobile} { grid-template-columns: minmax(0, 1fr); }
`;

const span = (desktop: number, tablet = desktop) => css`
  grid-column: span ${desktop};
  ${media.tablet} { grid-column: span ${tablet}; }
  ${media.mobile} { grid-column: auto; }
`;

export const Welcome = styled.div`
  ${span(4, 12)}
  align-self: center;
  padding-left: ${({ theme }) => theme.space(2)};

  h1 { font-size: ${({ theme }) => theme.fontSize['3xl']}; line-height: 1.1; }
  p { margin-top: ${({ theme }) => theme.space(2)}; color: ${({ theme }) => theme.colors.textMuted}; }

  ${media.mobile} {
    padding-left: 0;
    h1 { font-size: ${({ theme }) => theme.fontSize['2xl']}; }
  }
`;

export const Stats = styled.div`
  ${span(8, 12)}
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space(6)};

  ${media.tablet} { gap: ${({ theme }) => theme.space(4)}; }
  ${media.mobile} { grid-template-columns: minmax(0, 1fr); gap: ${({ theme }) => theme.space(3)}; }
`;

export const Stat = styled.div<{ $hazard?: boolean }>`
  position: relative;
  overflow: hidden;
  padding: ${({ theme }) => theme.space(5)};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => (theme.mode === 'dark' ? theme.colors.border : 'transparent')};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.card};

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  strong {
    display: block;
    margin-top: ${({ theme }) => theme.space(2)};
    font-family: ${({ theme }) => theme.font.display};
    font-size: ${({ theme }) => theme.fontSize['2xl']};
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }
  small {
    display: block;
    margin-top: ${({ theme }) => theme.space(2)};
    font-size: ${({ theme }) => theme.fontSize.sm};
    color: ${({ theme }) => theme.colors.textSubtle};
  }

  /* Faixa zebrada de sinalização: só aparece quando há itens pedindo atenção */
  ${({ $hazard, theme }) =>
    $hazard &&
    css`
      padding-bottom: ${theme.space(8)};
      &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 10px;
        background: repeating-linear-gradient(
          -45deg,
          ${theme.colors.warningSolid} 0 10px,
          ${theme.mode === 'dark' ? '#101418' : '#181D23'} 10px 20px
        );
      }
    `}

  ${media.mobile} { border-radius: ${({ theme }) => theme.radius.lg}; }
`;

export const ChartCard = styled.div`
  ${span(8, 12)}
  display: grid;
`;
export const GaugeCard = styled.div`
  ${span(4, 12)}
  display: grid;
`;
export const Third = styled.div`
  ${span(4, 6)}
  display: grid;

  ${media.tabletOnly} {
    &:last-child { grid-column: span 12; }
  }
`;

export const GaugeStats = styled.dl`
  display: flex;
  justify-content: space-between;
  margin: ${({ theme }) => theme.space(6)} 0 0;

  div:last-child { text-align: right; }
  dt { color: ${({ theme }) => theme.colors.textMuted}; }
  dd {
    margin: ${({ theme }) => theme.space(1)} 0 0;
    font-family: ${({ theme }) => theme.font.display};
    font-size: ${({ theme }) => theme.fontSize.xl};
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    font-variant-numeric: tabular-nums;
  }
`;

export const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
`;

const rowBase = css`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3.5)};
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)} ${theme.space(3)} ${theme.space(3)}`};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  min-width: 0;
`;

export const Row = styled.li`
  ${rowBase}
`;

export const RowLink = styled(Link)<{ $tone?: Tone }>`
  ${rowBase}
  transition: filter ${({ theme }) => theme.transition};

  ${({ theme, $tone }) => {
    const c = theme.colors;
    const bg = { danger: c.dangerSoft, warning: c.warningSoft, success: c.successSoft, info: c.infoSoft, primary: c.primarySoft };
    return $tone && $tone !== 'neutral' ? `background: ${bg[$tone]};` : '';
  }}

  > svg { width: 18px; height: 18px; flex-shrink: 0; color: ${({ theme }) => theme.colors.textMuted}; }
  &:hover { filter: brightness(${({ theme }) => (theme.mode === 'dark' ? 1.15 : 0.97)}); }
`;

export const RowBody = styled.div`
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  span {
    display: block;
    font-size: ${({ theme }) => theme.fontSize.sm};
    color: ${({ theme }) => theme.colors.textMuted};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const RowAside = styled.div`
  flex-shrink: 0;
  text-align: right;
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  strong {
    display: block;
    font-family: ${({ theme }) => theme.font.display};
    font-size: ${({ theme }) => theme.fontSize.lg};
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    color: ${({ theme }) => theme.colors.text};
    font-variant-numeric: tabular-nums;
  }
`;

export const AlertIcon = styled.span<{ $tone: Tone }>`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme, $tone }) =>
    ({
      danger: theme.colors.danger,
      warning: theme.colors.warning,
      success: theme.colors.success,
      info: theme.colors.info,
      primary: theme.colors.primaryText,
      neutral: theme.colors.textMuted,
    })[$tone]};

  svg { width: 18px; height: 18px; }
`;
