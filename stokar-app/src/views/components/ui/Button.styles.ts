import styled, { type DefaultTheme } from 'styled-components/native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

export function variantColors(theme: DefaultTheme, variant: ButtonVariant) {
  const c = theme.colors;
  const map = {
    primary: { bg: c.primary, pressed: c.primaryPressed, fg: c.primaryFg, border: 'transparent' },
    secondary: { bg: c.surfaceInset, pressed: c.border, fg: c.text, border: 'transparent' },
    outline: { bg: 'transparent', pressed: c.surfaceInset, fg: c.text, border: c.borderStrong },
    ghost: { bg: 'transparent', pressed: c.surfaceInset, fg: c.textMuted, border: 'transparent' },
    danger: { bg: c.dangerSoft, pressed: c.dangerSoft, fg: c.danger, border: 'transparent' },
  };
  return map[variant];
}

interface RootProps {
  $variant: ButtonVariant;
  $size: ButtonSize;
  $pressed: boolean;
  $disabled: boolean;
  $fullWidth: boolean;
  $iconOnly: boolean;
}

export const Root = styled.View<RootProps>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space(2)}px;
  min-height: ${({ theme, $size }) => ($size === 'sm' ? 38 : theme.touch)}px;
  min-width: ${({ theme, $size }) => ($size === 'sm' ? 38 : theme.touch)}px;
  padding: 0 ${({ theme, $size, $iconOnly }) => ($iconOnly ? 0 : theme.space($size === 'sm' ? 3.5 : 5))}px;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  border-width: 1px;
  border-color: ${({ theme, $variant }) => variantColors(theme, $variant).border};
  background-color: ${({ theme, $variant, $pressed }) => {
    const colors = variantColors(theme, $variant);
    return $pressed ? colors.pressed : colors.bg;
  }};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  align-self: ${({ $fullWidth }) => ($fullWidth ? 'stretch' : 'flex-start')};
`;

export const Label = styled.Text<{ $variant: ButtonVariant; $size: ButtonSize }>`
  font-family: ${({ theme }) => theme.fonts.semibold};
  font-size: ${({ theme, $size }) => ($size === 'sm' ? theme.fontSize.sm : theme.fontSize.md)}px;
  color: ${({ theme, $variant }) => variantColors(theme, $variant).fg};
`;
