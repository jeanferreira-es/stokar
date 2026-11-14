import styled, { css } from 'styled-components';
import { media } from '@/styles/tokens';

const control = css`
  width: 100%;
  min-height: 42px;
  padding: 0 ${({ theme }) => theme.space(3.5)};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.text};
  transition: border-color ${({ theme }) => theme.transition}, background ${({ theme }) => theme.transition};

  &::placeholder { color: ${({ theme }) => theme.colors.textSubtle}; }
  &:hover:not(:disabled) { border-color: ${({ theme }) => theme.colors.borderStrong}; }
  &:focus-visible {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primarySoft};
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &[aria-invalid='true'] { border-color: ${({ theme }) => theme.colors.danger}; }

  /* evita o zoom automático do iOS em campos com fonte < 16px */
  ${media.mobile} { font-size: 1rem; }
`;

export const Input = styled.input`
  ${control}
`;

export const Textarea = styled.textarea`
  ${control}
  padding-top: ${({ theme }) => theme.space(2.5)};
  padding-bottom: ${({ theme }) => theme.space(2.5)};
  min-height: 96px;
  resize: vertical;
`;

export const Select = styled.select`
  ${control}
  appearance: none;
  padding-right: ${({ theme }) => theme.space(9)};
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236E7A87' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
`;

export const FieldRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1.5)};
  min-width: 0;
`;

export const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Hint = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.textSubtle};
`;

export const ErrorText = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.danger};
`;

export const FormGrid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns = 2 }) => $columns}, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space(4)};

  ${media.mobile} { grid-template-columns: 1fr; }
`;

export const FormStack = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
`;

export const SearchWrap = styled.div`
  position: relative;
  flex: 1;
  min-width: 180px;
  max-width: 360px;

  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 17px;
    height: 17px;
    color: ${({ theme }) => theme.colors.textSubtle};
    pointer-events: none;
  }
  input {
    padding-left: 38px;
    border-radius: ${({ theme }) => theme.radius.pill};
    background: ${({ theme }) => theme.colors.surface};
  }

  ${media.mobile} { max-width: none; flex-basis: 100%; }
`;

/** Campo de senha com o botão de mostrar/ocultar à direita. */
export const PasswordWrap = styled.div`
  position: relative;

  input { padding-right: 46px; }
`;

export const PasswordToggle = styled.button`
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: none;
  color: ${({ theme }) => theme.colors.textSubtle};
  cursor: pointer;

  &:hover { color: ${({ theme }) => theme.colors.text}; background: ${({ theme }) => theme.colors.surfaceInset}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.primary}; outline-offset: 1px; }
  svg { width: 18px; height: 18px; }
`;
