import styled, { type DefaultTheme } from 'styled-components/native';
import type { Tone } from '@/models/labels';

export function toneColors(theme: DefaultTheme, tone: Tone = 'neutral') {
  const c = theme.colors;
  const map: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: c.surfaceInset, fg: c.textMuted },
    primary: { bg: c.primarySoft, fg: c.primaryText },
    success: { bg: c.successSoft, fg: c.success },
    warning: { bg: c.warningSoft, fg: c.warning },
    danger: { bg: c.dangerSoft, fg: c.danger },
    info: { bg: c.infoSoft, fg: c.info },
  };
  return map[tone];
}

export const Card = styled.View`
  padding: ${({ theme }) => theme.space(4)}px;
  border-radius: ${({ theme }) => theme.radius.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => (theme.mode === 'dark' ? theme.colors.border : 'transparent')};
  background-color: ${({ theme }) => theme.colors.surface};
  gap: ${({ theme }) => theme.space(3)}px;
`;

export const Row = styled.View<{ $gap?: number; $between?: boolean; $top?: boolean }>`
  flex-direction: row;
  align-items: ${({ $top }) => ($top ? 'flex-start' : 'center')};
  justify-content: ${({ $between }) => ($between ? 'space-between' : 'flex-start')};
  gap: ${({ theme, $gap = 3 }) => theme.space($gap)}px;
`;

export const Stack = styled.View<{ $gap?: number }>`
  gap: ${({ theme, $gap = 4 }) => theme.space($gap)}px;
`;

export const Fill = styled.View`
  flex: 1;
  min-width: 0;
`;

export const Divider = styled.View`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.border};
`;

export const BadgeRoot = styled.View<{ $tone?: Tone }>`
  align-self: flex-start;
  padding: ${({ theme }) => theme.space(1)}px ${({ theme }) => theme.space(2.5)}px;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background-color: ${({ theme, $tone }) => toneColors(theme, $tone).bg};
`;

export const BadgeLabel = styled.Text<{ $tone?: Tone }>`
  font-family: ${({ theme }) => theme.fonts.semibold};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme, $tone }) => toneColors(theme, $tone).fg};
`;

export const AvatarRoot = styled.View<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: ${({ $size }) => $size / 2}px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => (theme.mode === 'dark' ? theme.colors.surfaceInset : theme.colors.text)};
`;

export const AvatarLabel = styled.Text<{ $size: number }>`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: ${({ $size }) => Math.round($size * 0.38)}px;
  color: ${({ theme }) => (theme.mode === 'dark' ? theme.colors.text : theme.colors.surface)};
`;

export const IconBubble = styled.View<{ $tone?: Tone; $size?: number }>`
  width: ${({ $size = 40 }) => $size}px;
  height: ${({ $size = 40 }) => $size}px;
  border-radius: ${({ $size = 40 }) => $size / 2}px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, $tone = 'primary' }) => toneColors(theme, $tone).bg};
`;

export const Empty = styled.View`
  align-items: center;
  gap: ${({ theme }) => theme.space(3)}px;
  padding: ${({ theme }) => theme.space(8)}px ${({ theme }) => theme.space(5)}px;
`;

export const EmptyText = styled.Text`
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  line-height: 19px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Counter = styled.View`
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.primary};
`;

export const CounterLabel = styled.Text`
  font-family: ${({ theme }) => theme.fonts.semibold};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  color: ${({ theme }) => theme.colors.primaryFg};
`;

export const ChipRoot = styled.View<{ $active: boolean }>`
  min-height: 38px;
  justify-content: center;
  padding: 0 ${({ theme }) => theme.space(4)}px;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  border-width: 1px;
  border-color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.border)};
  background-color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.surface)};
`;

export const ChipLabel = styled.Text<{ $active: boolean }>`
  font-family: ${({ theme }) => theme.fonts.medium};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme, $active }) => ($active ? theme.colors.bg : theme.colors.textMuted)};
`;

export const Callout = styled.View<{ $tone: Tone }>`
  flex-direction: row;
  gap: ${({ theme }) => theme.space(3)}px;
  padding: ${({ theme }) => theme.space(3.5)}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme, $tone }) => toneColors(theme, $tone).bg};
`;

export const ListItemRoot = styled.View<{ $pressed: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)}px;
  min-height: ${({ theme }) => theme.touch + 8}px;
  padding: ${({ theme }) => theme.space(2.5)}px ${({ theme }) => theme.space(4)}px;
  background-color: ${({ theme, $pressed }) => ($pressed ? theme.colors.surfaceInset : 'transparent')};
`;

export const Group = styled.View`
  border-radius: ${({ theme }) => theme.radius.lg}px;
  border-width: 1px;
  border-color: ${({ theme }) => (theme.mode === 'dark' ? theme.colors.border : 'transparent')};
  background-color: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
`;
