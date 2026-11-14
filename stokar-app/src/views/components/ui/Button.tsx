import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import { useTheme } from 'styled-components/native';
import * as S from './Button.styles';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  /** Texto do botão. Vazio = botão só com ícone (informe `accessibilityLabel`). */
  label: string;
  variant?: S.ButtonVariant;
  size?: S.ButtonSize;
  icon?: LucideIcon;
  loading?: boolean;
  /** Ocupa toda a largura (padrão) ou só o conteúdo. */
  fullWidth?: boolean;
}

/** Botão no padrão do site (variantes do shadcn/ui), em styled-components. */
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading,
  fullWidth = true,
  disabled,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const color = S.variantColors(theme, variant).fg;
  const blocked = !!disabled || !!loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: !!loading }}
      disabled={blocked}
      style={{ alignSelf: fullWidth ? 'stretch' : 'flex-start' }}
      {...rest}
    >
      {({ pressed }) => (
        <S.Root $variant={variant} $size={size} $pressed={pressed} $disabled={blocked} $fullWidth={fullWidth} $iconOnly={!label}>
          {loading ? <ActivityIndicator size="small" color={color} /> : Icon ? <Icon size={18} color={color} /> : null}
          {label ? (
            <S.Label $variant={variant} $size={size}>
              {label}
            </S.Label>
          ) : null}
        </S.Root>
      )}
    </Pressable>
  );
}
