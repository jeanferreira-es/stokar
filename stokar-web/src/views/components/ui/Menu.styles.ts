import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import * as RadixPopover from '@radix-ui/react-popover';
import styled, { css, keyframes } from 'styled-components';

const dropIn = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
`;

const panel = css`
  z-index: ${({ theme }) => theme.z.popover};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.pop};
  animation: ${dropIn} 140ms ease;
`;

export const MenuContent = styled(RadixMenu.Content)`
  ${panel}
  min-width: 200px;
  padding: ${({ theme }) => theme.space(1.5)};
`;

export const MenuItem = styled(RadixMenu.Item)<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
  padding: ${({ theme }) => `${theme.space(2.5)} ${theme.space(3)}`};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  color: ${({ theme, $danger }) => ($danger ? theme.colors.danger : theme.colors.text)};
  cursor: pointer;
  user-select: none;

  svg { width: 16px; height: 16px; }

  &[data-highlighted] {
    outline: none;
    background: ${({ theme, $danger }) => ($danger ? theme.colors.dangerSoft : theme.colors.surfaceInset)};
  }
  &[data-disabled] { opacity: 0.5; pointer-events: none; }
`;

export const MenuLabel = styled(RadixMenu.Label)`
  padding: ${({ theme }) => `${theme.space(2)} ${theme.space(3)}`};
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.textSubtle};
`;

export const MenuSeparator = styled(RadixMenu.Separator)`
  height: 1px;
  margin: ${({ theme }) => theme.space(1.5)} 0;
  background: ${({ theme }) => theme.colors.border};
`;

export const PopoverContent = styled(RadixPopover.Content)`
  ${panel}
  width: min(calc(100vw - 24px), var(--popover-width, 380px));
  max-height: min(70dvh, var(--radix-popover-content-available-height));
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &:focus { outline: none; }
`;
