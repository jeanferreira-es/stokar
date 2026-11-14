import styled from 'styled-components';
import { media } from '@/styles/tokens';

export const Items = styled.fieldset`
  margin: 0;
  padding: 0;
  border: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2.5)};
  min-width: 0;

  legend {
    padding: 0;
    margin-bottom: ${({ theme }) => theme.space(1.5)};
    font-size: ${({ theme }) => theme.fontSize.sm};
    font-weight: ${({ theme }) => theme.fontWeight.medium};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

/** Linha de serviço ou material. `$priced` acrescenta a coluna de valor (equipe). */
export const ItemRow = styled.div<{ $priced?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $priced }) => ($priced ? 'minmax(0, 1fr) 84px 124px auto' : 'minmax(0, 1fr) 110px auto')};
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
  padding: ${({ theme }) => `${theme.space(2)} ${theme.space(2)} ${theme.space(2)} ${theme.space(3.5)}`};
  background: ${({ theme }) => theme.colors.surfaceInset};
  border-radius: ${({ theme }) => theme.radius.md};

  > div { min-width: 0; display: flex; flex-direction: column; }
  strong {
    font-size: ${({ theme }) => theme.fontSize.sm};
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  small { color: ${({ theme }) => theme.colors.textSubtle}; }
  small[data-short='true'] { color: ${({ theme }) => theme.colors.danger}; }
  input { background: ${({ theme }) => theme.colors.surface}; }

  ${media.mobile} {
    grid-template-columns: ${({ $priced }) => ($priced ? 'minmax(0, 1fr) minmax(0, 1fr) auto' : 'minmax(0, 1fr) 96px auto')};
    > div:first-child { grid-column: ${({ $priced }) => ($priced ? '1 / -1' : 'auto')}; }
  }
`;

export const AddRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2.5)};

  select { flex: 1; min-width: 200px; }
`;

export const Summary = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: ${({ theme }) => `${theme.space(1.5)} ${theme.space(4)}`};
  padding: ${({ theme }) => theme.space(4)};
  background: ${({ theme }) => theme.colors.surfaceInset};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.fontSize.sm};

  dt { color: ${({ theme }) => theme.colors.textMuted}; }
  dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
  dt[data-total], dd[data-total] {
    padding-top: ${({ theme }) => theme.space(2)};
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.font.display};
    font-size: ${({ theme }) => theme.fontSize.lg};
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
  }
`;
