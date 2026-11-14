import styled from 'styled-components/native';

export const DayDivider = styled.Text`
  align-self: center;
  margin: ${({ theme }) => theme.space(2)}px 0;
  padding: ${({ theme }) => theme.space(1)}px ${({ theme }) => theme.space(3)}px;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.surfaceInset};
  color: ${({ theme }) => theme.colors.textSubtle};
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
`;

/** `$mine`: mensagem de quem está usando o app (lado direito). */
export const Bubble = styled.View<{ $mine: boolean }>`
  align-self: ${({ $mine }) => ($mine ? 'flex-end' : 'flex-start')};
  max-width: 82%;
  margin-bottom: ${({ theme }) => theme.space(2)}px;
  padding: ${({ theme }) => theme.space(2.5)}px ${({ theme }) => theme.space(3.5)}px;
  border-radius: ${({ theme }) => theme.radius.lg}px;
  border-bottom-right-radius: ${({ theme, $mine }) => ($mine ? 4 : theme.radius.lg)}px;
  border-bottom-left-radius: ${({ theme, $mine }) => ($mine ? theme.radius.lg : 4)}px;
  border-width: 1px;
  border-color: ${({ theme, $mine }) => ($mine ? 'transparent' : theme.colors.border)};
  background-color: ${({ theme, $mine }) => ($mine ? theme.colors.primary : theme.colors.surface)};
`;

export const BubbleText = styled.Text<{ $mine: boolean }>`
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.fontSize.md}px;
  line-height: 21px;
  color: ${({ theme, $mine }) => ($mine ? theme.colors.primaryFg : theme.colors.text)};
`;

export const BubbleMeta = styled.Text<{ $mine: boolean }>`
  margin-top: 2px;
  text-align: right;
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme, $mine }) => ($mine ? theme.colors.primaryFg : theme.colors.textSubtle)};
  opacity: 0.8;
`;

export const Composer = styled.View<{ $inset: number }>`
  flex-direction: row;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space(2.5)}px;
  padding: ${({ theme }) => theme.space(2.5)}px ${({ theme }) => theme.space(3)}px;
  padding-bottom: ${({ theme, $inset }) => Math.max($inset, theme.space(2.5))}px;
  border-top-width: 1px;
  border-top-color: ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const ComposerInput = styled.TextInput`
  flex: 1;
  min-height: ${({ theme }) => theme.touch}px;
  max-height: 130px;
  padding: ${({ theme }) => theme.space(3)}px ${({ theme }) => theme.space(4)}px;
  border-radius: ${({ theme }) => theme.radius.xl}px;
  background-color: ${({ theme }) => theme.colors.surfaceInset};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.fontSize.md}px;
`;

export const SendButton = styled.View<{ $disabled: boolean }>`
  width: ${({ theme }) => theme.touch}px;
  height: ${({ theme }) => theme.touch}px;
  border-radius: ${({ theme }) => theme.touch / 2}px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.primary};
  opacity: ${({ $disabled }) => ($disabled ? 0.45 : 1)};
`;
