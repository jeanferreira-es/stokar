import styled from 'styled-components/native';

export const FieldRoot = styled.View`
  gap: ${({ theme }) => theme.space(1.5)}px;
`;

export const Input = styled.TextInput<{ $invalid?: boolean; $multiline?: boolean }>`
  min-height: ${({ theme, $multiline }) => ($multiline ? 104 : theme.touch)}px;
  padding: ${({ theme, $multiline }) => ($multiline ? theme.space(3) : 0)}px ${({ theme }) => theme.space(3.5)}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  border-width: 1px;
  border-color: ${({ theme, $invalid }) => ($invalid ? theme.colors.danger : theme.colors.border)};
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.fontSize.md}px;
`;

export const Hint = styled.Text`
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.textSubtle};
`;

export const ErrorText = styled(Hint)`
  font-family: ${({ theme }) => theme.fonts.medium};
  color: ${({ theme }) => theme.colors.danger};
`;

export const SelectTrigger = styled.View<{ $pressed: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(2)}px;
  min-height: ${({ theme }) => theme.touch}px;
  padding: 0 ${({ theme }) => theme.space(3.5)}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  border-width: 1px;
  border-color: ${({ theme }) => theme.colors.border};
  background-color: ${({ theme, $pressed }) => ($pressed ? theme.colors.surfaceInset : theme.colors.surfaceAlt)};
`;

export const SelectValue = styled.Text<{ $placeholder: boolean }>`
  flex: 1;
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.fontSize.md}px;
  color: ${({ theme, $placeholder }) => ($placeholder ? theme.colors.textSubtle : theme.colors.text)};
`;

export const SegmentedRoot = styled.View`
  flex-direction: row;
  padding: ${({ theme }) => theme.space(1)}px;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background-color: ${({ theme }) => theme.colors.surfaceInset};
`;

export const SegmentedItem = styled.View<{ $active: boolean }>`
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background-color: ${({ theme, $active }) => ($active ? theme.colors.surface : 'transparent')};
`;

export const SegmentedLabel = styled.Text<{ $active: boolean }>`
  font-family: ${({ theme, $active }) => ($active ? theme.fonts.semibold : theme.fonts.medium)};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.textMuted)};
`;

export const PasswordWrap = styled.View`
  justify-content: center;
`;

/** Área de toque do "olhinho", sobre a ponta direita do campo. */
export const PasswordToggle = styled.Pressable`
  position: absolute;
  right: 0;
  width: ${({ theme }) => theme.touch}px;
  height: ${({ theme }) => theme.touch}px;
  align-items: center;
  justify-content: center;
`;
