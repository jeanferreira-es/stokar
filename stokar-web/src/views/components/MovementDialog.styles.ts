import styled from 'styled-components';

export const Balance = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)}`};
  background: ${({ theme }) => theme.colors.surfaceInset};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  div { display: flex; flex-direction: column; }
  div:last-child { text-align: right; }
  strong {
    font-family: ${({ theme }) => theme.font.display};
    font-size: ${({ theme }) => theme.fontSize.xl};
    color: ${({ theme }) => theme.colors.text};
    font-variant-numeric: tabular-nums;
  }
  strong[data-negative='true'] { color: ${({ theme }) => theme.colors.danger}; }
  svg { width: 18px; height: 18px; color: ${({ theme }) => theme.colors.textSubtle}; }
`;
