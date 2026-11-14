import styled from 'styled-components/native';

export const Header = styled.View<{ $top: number }>`
  gap: ${({ theme }) => theme.space(3)}px;
  padding: ${({ theme, $top }) => $top + theme.space(3)}px ${({ theme }) => theme.space(4)}px ${({ theme }) => theme.space(3)}px;
  background-color: ${({ theme }) => theme.colors.bg};
`;

export const Fab = styled.View<{ $pressed: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)}px;
  height: 56px;
  padding: 0 ${({ theme }) => theme.space(5)}px;
  border-radius: 28px;
  background-color: ${({ theme, $pressed }) => ($pressed ? theme.colors.primaryPressed : theme.colors.primary)};
  elevation: 5;
`;

export const FabLabel = styled.Text`
  font-family: ${({ theme }) => theme.fonts.semibold};
  font-size: ${({ theme }) => theme.fontSize.md}px;
  color: ${({ theme }) => theme.colors.primaryFg};
`;

export const Code = styled.Text`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: ${({ theme }) => theme.fontSize.md}px;
  color: ${({ theme }) => theme.colors.primaryText};
`;

/* ---------- Linha do tempo ---------- */
export const Step = styled.View`
  flex-direction: row;
  gap: ${({ theme }) => theme.space(3)}px;
`;

export const StepRail = styled.View`
  align-items: center;
  width: 26px;
`;

export const StepDot = styled.View<{ $state: 'done' | 'current' | 'todo' | 'stopped' }>`
  width: 26px;
  height: 26px;
  border-radius: 13px;
  align-items: center;
  justify-content: center;
  border-width: 2px;
  border-color: ${({ theme, $state }) => ($state === 'current' ? theme.colors.primary : 'transparent')};
  background-color: ${({ theme, $state }) => {
    const c = theme.colors;
    if ($state === 'done') return c.primary;
    if ($state === 'current') return c.primarySoft;
    if ($state === 'stopped') return c.dangerSoft;
    return c.surfaceInset;
  }};
`;

export const StepLine = styled.View<{ $done: boolean }>`
  flex: 1;
  width: 2px;
  min-height: 18px;
  background-color: ${({ theme, $done }) => ($done ? theme.colors.primary : theme.colors.border)};
`;

export const StepBody = styled.View`
  flex: 1;
  padding-bottom: ${({ theme }) => theme.space(4)}px;
`;

/* ---------- Formulário ---------- */
export const LineBox = styled.View`
  gap: ${({ theme }) => theme.space(2.5)}px;
  padding: ${({ theme }) => theme.space(3)}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  background-color: ${({ theme }) => theme.colors.surfaceInset};
`;

export const ServiceOption = styled.View<{ $selected: boolean; $pressed: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)}px;
  min-height: 56px;
  padding: ${({ theme }) => theme.space(2.5)}px ${({ theme }) => theme.space(3.5)}px;
  border-radius: ${({ theme }) => theme.radius.md}px;
  border-width: 1.5px;
  border-color: ${({ theme, $selected }) => ($selected ? theme.colors.primary : theme.colors.border)};
  background-color: ${({ theme, $selected, $pressed }) =>
    $selected ? theme.colors.primarySoft : $pressed ? theme.colors.surfaceInset : theme.colors.surface};
`;

export const Check = styled.View<{ $selected: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  border-width: 2px;
  border-color: ${({ theme, $selected }) => ($selected ? theme.colors.primary : theme.colors.borderStrong)};
  background-color: ${({ theme, $selected }) => ($selected ? theme.colors.primary : 'transparent')};
`;

export const GroupTitle = styled.Text`
  margin-top: ${({ theme }) => theme.space(1)}px;
  font-family: ${({ theme }) => theme.fonts.semibold};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textSubtle};
`;

/* ---------- Tela inicial: sininho e novidades ---------- */
export const BellButton = styled.View<{ $pressed: boolean }>`
  width: ${({ theme }) => theme.touch}px;
  height: ${({ theme }) => theme.touch}px;
  border-radius: ${({ theme }) => theme.touch / 2}px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, $pressed }) => ($pressed ? theme.colors.border : theme.colors.surface)};
`;

export const BellBadge = styled.View`
  position: absolute;
  top: -2px;
  right: -4px;
`;

export const NewsCard = styled.View<{ $pressed: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)}px;
  padding: ${({ theme }) => theme.space(3)}px ${({ theme }) => theme.space(3.5)}px;
  border-radius: ${({ theme }) => theme.radius.lg}px;
  border-width: 1.5px;
  border-color: ${({ theme }) => theme.colors.primary};
  background-color: ${({ theme, $pressed }) => ($pressed ? theme.colors.primarySoft : theme.colors.surface)};
`;
