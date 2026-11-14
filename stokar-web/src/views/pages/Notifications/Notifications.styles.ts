import styled from 'styled-components';

export const List = styled.ul`
  padding: ${({ theme }) => theme.space(2)};
`;

export const Entry = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};

  & + & { margin-top: ${({ theme }) => theme.space(1)}; }
  > button:first-child { flex: 1; min-width: 0; }
`;

export const EntryActions = styled.div`
  display: flex;
  flex-shrink: 0;
`;

export const Pager = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(5)}`};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;
