import styled from 'styled-components/native';

export const Hero = styled.View`
  align-items: center;
  gap: ${({ theme }) => theme.space(3)}px;
  padding: ${({ theme }) => theme.space(8)}px 0 ${({ theme }) => theme.space(4)}px;
`;

export const Tagline = styled.Text`
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.fontSize.md}px;
  line-height: 21px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Legal = styled.Text`
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  line-height: 17px;
  color: ${({ theme }) => theme.colors.textSubtle};
`;

export const Link = styled.Text`
  font-family: ${({ theme }) => theme.fonts.semibold};
  color: ${({ theme }) => theme.colors.primaryText};
  text-decoration-line: underline;
`;

/* ---------- Atalho "Entrar como" ---------- */
export const AccountRow = styled.View<{ $selected: boolean; $pressed: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)}px;
  min-height: ${({ theme }) => theme.touch + 8}px;
  padding: ${({ theme }) => theme.space(2)}px ${({ theme }) => theme.space(1)}px ${({ theme }) => theme.space(2)}px
    ${({ theme }) => theme.space(3)}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  border-width: 1.5px;
  border-color: ${({ theme, $selected }) => ($selected ? theme.colors.primary : theme.colors.border)};
  background-color: ${({ theme, $pressed, $selected }) =>
    $pressed ? theme.colors.surfaceInset : $selected ? theme.colors.primarySoft : theme.colors.surface};
`;

export const RemoveButton = styled.View`
  width: ${({ theme }) => theme.touch}px;
  height: ${({ theme }) => theme.touch}px;
  align-items: center;
  justify-content: center;
`;
