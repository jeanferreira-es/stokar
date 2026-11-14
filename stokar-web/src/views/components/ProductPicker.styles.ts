import styled from 'styled-components';

export const Trigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(2)};
  width: 100%;
  min-height: 42px;
  padding: 0 ${({ theme }) => theme.space(3.5)};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  text-align: left;

  span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  span[data-placeholder] { color: ${({ theme }) => theme.colors.textSubtle}; }
  svg { width: 16px; height: 16px; flex-shrink: 0; color: ${({ theme }) => theme.colors.textSubtle}; }

  &:hover { border-color: ${({ theme }) => theme.colors.borderStrong}; }
  &[aria-invalid='true'] { border-color: ${({ theme }) => theme.colors.danger}; }
`;

export const SearchBox = styled.div`
  padding: ${({ theme }) => theme.space(2.5)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Options = styled.ul`
  overflow-y: auto;
  max-height: 280px;
  padding: ${({ theme }) => theme.space(1.5)};
`;

export const Option = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
  width: 100%;
  padding: ${({ theme }) => `${theme.space(2.5)} ${theme.space(3)}`};
  border: 0;
  background: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  text-align: left;

  div { min-width: 0; display: flex; flex-direction: column; }
  strong {
    font-size: ${({ theme }) => theme.fontSize.sm};
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  small { color: ${({ theme }) => theme.colors.textSubtle}; }
  em {
    flex-shrink: 0;
    font-style: normal;
    font-size: ${({ theme }) => theme.fontSize.sm};
    color: ${({ theme }) => theme.colors.textMuted};
    font-variant-numeric: tabular-nums;
  }

  &:hover, &:focus-visible { background: ${({ theme }) => theme.colors.surfaceInset}; outline: none; }
`;

export const Note = styled.p`
  padding: ${({ theme }) => theme.space(5)};
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textSubtle};
`;
