import { Slot } from '@radix-ui/react-slot';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import * as S from './Button.styles';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: S.ButtonVariant;
  size?: S.ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  /** Renderiza o filho (ex.: <Link>) com a aparência do botão, como no shadcn/ui. */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, fullWidth, asChild, disabled, children, type, ...rest },
  ref,
) {
  if (asChild) {
    return (
      <S.Root as={Slot} ref={ref} $variant={variant} $size={size} $fullWidth={fullWidth} {...rest}>
        {children}
      </S.Root>
    );
  }
  return (
    <S.Root
      ref={ref}
      type={type ?? 'button'}
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <S.Spinner aria-hidden />}
      {children}
    </S.Root>
  );
});
