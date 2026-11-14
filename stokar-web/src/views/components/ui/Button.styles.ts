import styled, { css, keyframes } from 'styled-components';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'icon';

const variants = {
  primary: css`
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primaryFg};
    &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.primaryHover}; }
  `,
  secondary: css`
    background: ${({ theme }) => theme.colors.surfaceInset};
    color: ${({ theme }) => theme.colors.text};
    &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.border}; }
  `,
  outline: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.borderStrong};
    &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.surfaceAlt}; }
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.textMuted};
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.surfaceInset};
      color: ${({ theme }) => theme.colors.text};
    }
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.dangerSoft};
    color: ${({ theme }) => theme.colors.danger};
    &:hover:not(:disabled) { filter: brightness(0.96); }
  `,
};

const sizes = {
  sm: css`
    height: 34px;
    padding: 0 ${({ theme }) => theme.space(3)};
    font-size: ${({ theme }) => theme.fontSize.sm};
  `,
  md: css`
    height: 42px;
    padding: 0 ${({ theme }) => theme.space(4.5)};
    font-size: ${({ theme }) => theme.fontSize.md};
  `,
  icon: css`
    height: 42px;
    width: 42px;
    padding: 0;
  `,
};

const spin = keyframes`to { transform: rotate(360deg); }`;

export const Root = styled.button<{ $variant: ButtonVariant; $size: ButtonSize; $fullWidth?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space(2)};
  flex-shrink: 0;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  white-space: nowrap;
  transition: background ${({ theme }) => theme.transition}, color ${({ theme }) => theme.transition},
    border-color ${({ theme }) => theme.transition};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};

  svg { width: 18px; height: 18px; flex-shrink: 0; }

  &:disabled { opacity: 0.55; cursor: not-allowed; }

  ${({ $variant }) => variants[$variant]}
  ${({ $size }) => sizes[$size]}
`;

export const Spinner = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: ${spin} 700ms linear infinite;
`;
