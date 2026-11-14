import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { media } from '@/styles/tokens';

export const Back = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1.5)};
  margin-bottom: ${({ theme }) => theme.space(4)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};

  svg { width: 16px; height: 16px; }
  &:hover { color: ${({ theme }) => theme.colors.text}; }
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2.5)};
  margin-top: ${({ theme }) => theme.space(2)};
`;

export const Code = styled.span`
  font-family: ${({ theme }) => theme.font.display};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primaryText};
  font-variant-numeric: tabular-nums;
`;

export const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: ${({ theme }) => theme.space(6)};
  align-items: start;

  ${media.tablet} { grid-template-columns: minmax(0, 1fr); gap: ${({ theme }) => theme.space(4)}; }
`;

export const Prose = styled.p`
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-width: 75ch;
  color: ${({ theme }) => theme.colors.text};
`;

export const Callout = styled.div<{ $tone: 'danger' | 'warning' | 'success' | 'neutral' }>`
  display: flex;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(4)};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.fontSize.sm};
  ${({ theme, $tone }) => {
    const c = theme.colors;
    const map = {
      danger: [c.dangerSoft, c.danger],
      warning: [c.warningSoft, c.warning],
      success: [c.successSoft, c.success],
      neutral: [c.surfaceInset, c.textMuted],
    };
    return `background: ${map[$tone][0]}; color: ${map[$tone][1]};`;
  }}

  svg { width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }
  strong { display: block; font-weight: ${({ theme }) => theme.fontWeight.semibold}; }
  p { color: ${({ theme }) => theme.colors.text}; white-space: pre-wrap; overflow-wrap: anywhere; }
`;

export const Materials = styled.ul`
  display: flex;
  flex-direction: column;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.space(4)};
    padding: ${({ theme }) => theme.space(3)} 0;
  }
  li + li { border-top: 1px solid ${({ theme }) => theme.colors.border}; }
  div { min-width: 0; }
  strong { display: block; font-weight: ${({ theme }) => theme.fontWeight.semibold}; }
  small { color: ${({ theme }) => theme.colors.textSubtle}; }
  small[data-short='true'] { color: ${({ theme }) => theme.colors.danger}; font-weight: ${({ theme }) => theme.fontWeight.semibold}; }
  em {
    flex-shrink: 0;
    font-style: normal;
    font-family: ${({ theme }) => theme.font.display};
    font-size: ${({ theme }) => theme.fontSize.lg};
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    font-variant-numeric: tabular-nums;
  }
`;

export const Facts = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: ${({ theme }) => `${theme.space(3)} ${theme.space(4)}`};
  font-size: ${({ theme }) => theme.fontSize.sm};

  dt { color: ${({ theme }) => theme.colors.textSubtle}; }
  dd { margin: 0; text-align: right; font-weight: ${({ theme }) => theme.fontWeight.medium}; overflow-wrap: anywhere; }
  dd a { color: ${({ theme }) => theme.colors.primaryText}; text-decoration: underline; }
  dd small { display: block; font-weight: ${({ theme }) => theme.fontWeight.regular}; color: ${({ theme }) => theme.colors.textSubtle}; }
`;

/** Etapas do fluxo OPEN → APPROVED → IN_PROGRESS → COMPLETED */
export const Steps = styled.ol`
  display: flex;
  flex-direction: column;
`;

export const Step = styled.li<{ $state: 'done' | 'current' | 'todo' | 'stopped' }>`
  position: relative;
  display: flex;
  gap: ${({ theme }) => theme.space(3)};
  padding-bottom: ${({ theme }) => theme.space(5)};
  color: ${({ theme, $state }) => ($state === 'todo' ? theme.colors.textSubtle : theme.colors.text)};

  &:last-child { padding-bottom: 0; }
  &:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 13px;
    top: 28px;
    bottom: 0;
    width: 2px;
    background: ${({ theme, $state }) => ($state === 'done' ? theme.colors.primary : theme.colors.border)};
  }

  i {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    font-style: normal;
    font-size: ${({ theme }) => theme.fontSize.xs};
    font-weight: ${({ theme }) => theme.fontWeight.bold};
    ${({ theme, $state }) => {
      const c = theme.colors;
      if ($state === 'done') return `background: ${c.primary}; color: ${c.primaryFg};`;
      if ($state === 'current') return `background: ${c.primarySoft}; color: ${c.primaryText}; box-shadow: inset 0 0 0 2px ${c.primary};`;
      if ($state === 'stopped') return `background: ${c.dangerSoft}; color: ${c.danger};`;
      return `background: ${c.surfaceInset}; color: ${c.textSubtle};`;
    }}
  }
  svg { width: 14px; height: 14px; }
  strong { display: block; font-weight: ${({ theme }) => theme.fontWeight.semibold}; line-height: 28px; }
  small { color: ${({ theme }) => theme.colors.textSubtle}; }
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2.5)};
`;

export const Check = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
  white-space: nowrap;
`;

export const Totals = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: ${({ theme }) => `${theme.space(2)} ${theme.space(4)}`};

  dt { color: ${({ theme }) => theme.colors.textMuted}; }
  dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
  dt[data-total], dd[data-total] {
    padding-top: ${({ theme }) => theme.space(3)};
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.font.display};
    font-size: ${({ theme }) => theme.fontSize.xl};
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
  }
`;

export const InvoiceLine = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};

  svg { width: 22px; height: 22px; flex-shrink: 0; color: ${({ theme }) => theme.colors.primaryText}; }
  strong { display: block; font-family: ${({ theme }) => theme.font.display}; font-weight: ${({ theme }) => theme.fontWeight.semibold}; }
  small { color: ${({ theme }) => theme.colors.textSubtle}; }
`;
