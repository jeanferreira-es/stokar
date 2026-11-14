import styled from 'styled-components/native';

export const Root = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.bg};
`;

export const Footer = styled.View<{ $inset: number }>`
  gap: ${({ theme }) => theme.space(2.5)}px;
  padding: ${({ theme }) => theme.space(3)}px ${({ theme }) => theme.space(4)}px;
  padding-bottom: ${({ theme, $inset }) => Math.max($inset, theme.space(3))}px;
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
`;
