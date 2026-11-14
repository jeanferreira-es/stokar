import styled from 'styled-components';
import { media } from '@/styles/tokens';

export const Wrap = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => (theme.mode === 'dark' ? theme.colors.border : 'transparent')};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.card};
  overflow: hidden;

  ${media.mobile} {
    background: transparent;
    border: 0;
    box-shadow: none;
    border-radius: 0;
    overflow: visible;
  }
`;

export const Scroll = styled.div`
  overflow-x: auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSize.sm};

  th, td {
    padding: ${({ theme }) => `${theme.space(3.5)} ${theme.space(5)}`};
    text-align: left;
    vertical-align: middle;
  }
  th {
    font-weight: ${({ theme }) => theme.fontWeight.medium};
    color: ${({ theme }) => theme.colors.textSubtle};
    white-space: nowrap;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  tbody tr + tr td { border-top: 1px solid ${({ theme }) => theme.colors.border}; }
  [data-align='right'] { text-align: right; }
  [data-numeric] { font-variant-numeric: tabular-nums; }

  /* Celular: cada linha vira um cartão com rótulo: valor */
  ${media.mobile} {
    display: block;

    thead {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
    tbody { display: flex; flex-direction: column; gap: ${({ theme }) => theme.space(3)}; }
    tr {
      display: flex;
      flex-direction: column;
      gap: ${({ theme }) => theme.space(2)};
      padding: ${({ theme }) => theme.space(4)};
      background: ${({ theme }) => theme.colors.surface};
      border: 1px solid ${({ theme }) => (theme.mode === 'dark' ? theme.colors.border : 'transparent')};
      border-radius: ${({ theme }) => theme.radius.lg};
      box-shadow: ${({ theme }) => theme.shadow.card};
    }
    td, tbody tr + tr td {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${({ theme }) => theme.space(4)};
      padding: 0;
      border: 0;
      text-align: right;
    }
    td::before {
      content: attr(data-label);
      flex-shrink: 0;
      color: ${({ theme }) => theme.colors.textSubtle};
      text-align: left;
    }
    td[data-primary] {
      justify-content: flex-start;
      text-align: left;
      padding-bottom: ${({ theme }) => theme.space(2)};
      border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    }
    td[data-primary]::before, td[data-actions]::before { content: none; }
    td[data-actions] { justify-content: flex-end; padding-top: ${({ theme }) => theme.space(1)}; }
  }
`;

export const Row = styled.tr<{ $clickable?: boolean }>`
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: background ${({ theme }) => theme.transition};

  ${media.desktop} {
    &:hover { background: ${({ theme, $clickable }) => ($clickable ? theme.colors.surfaceAlt : 'transparent')}; }
  }
`;

export const CellTitle = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong { font-weight: ${({ theme }) => theme.fontWeight.semibold}; font-size: ${({ theme }) => theme.fontSize.md}; }
  span { color: ${({ theme }) => theme.colors.textSubtle}; font-size: ${({ theme }) => theme.fontSize.sm}; }
`;

export const RowActions = styled.div`
  display: inline-flex;
  gap: ${({ theme }) => theme.space(1)};
`;

export const Pagination = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(5)}`};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  div { display: flex; gap: ${({ theme }) => theme.space(2)}; }

  ${media.mobile} {
    border-top: 0;
    padding: ${({ theme }) => `${theme.space(4)} 0 0`};
  }
`;
