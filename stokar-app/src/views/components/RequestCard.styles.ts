import styled from 'styled-components/native';

export const Root = styled.View<{ $pressed: boolean }>`
  padding: ${({ theme }) => theme.space(4)}px;
  gap: ${({ theme }) => theme.space(2.5)}px;
  border-radius: ${({ theme }) => theme.radius.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => (theme.mode === 'dark' ? theme.colors.border : 'transparent')};
  background-color: ${({ theme, $pressed }) => ($pressed ? theme.colors.surfaceAlt : theme.colors.surface)};
`;

export const Code = styled.Text`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.primaryText};
`;
