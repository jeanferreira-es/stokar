import * as RadixDialog from '@radix-ui/react-dialog';
import styled, { keyframes } from 'styled-components';
import { media } from '@/styles/tokens';

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const popIn = keyframes`
  from { opacity: 0; transform: translate(-50%, -48%) scale(0.98); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;
const sheetIn = keyframes`from { transform: translateY(100%); } to { transform: translateY(0); }`;

export const Overlay = styled(RadixDialog.Overlay)`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.z.overlay};
  background: ${({ theme }) => theme.colors.overlay};
  animation: ${fadeIn} 160ms ease;
`;

export const Content = styled(RadixDialog.Content)<{ $size: 'sm' | 'md' | 'lg' }>`
  position: fixed;
  z-index: ${({ theme }) => theme.z.modal};
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(calc(100vw - 32px), ${({ $size }) => ({ sm: '420px', md: '560px', lg: '720px' })[$size]});
  max-height: min(88dvh, 860px);
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.pop};
  animation: ${popIn} 180ms ease;

  &:focus { outline: none; }

  /* No celular o diálogo vira uma folha inferior */
  ${media.mobile} {
    top: auto;
    bottom: 0;
    left: 0;
    transform: none;
    width: 100%;
    max-height: 92dvh;
    border-radius: ${({ theme }) => `${theme.radius.xl} ${theme.radius.xl} 0 0`};
    border-bottom: 0;
    padding-bottom: env(safe-area-inset-bottom);
    animation: ${sheetIn} 220ms ease;
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => `${theme.space(6)} ${theme.space(6)} ${theme.space(2)}`};
`;

export const Title = styled(RadixDialog.Title)`
  font-size: ${({ theme }) => theme.fontSize.xl};
`;

export const Description = styled(RadixDialog.Description)`
  margin-top: ${({ theme }) => theme.space(1)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

export const Body = styled.div`
  padding: ${({ theme }) => `${theme.space(4)} ${theme.space(6)} ${theme.space(6)}`};
  overflow-y: auto;
`;

export const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space(3)};
  margin-top: ${({ theme }) => theme.space(2)};

  ${media.mobile} {
    flex-direction: column-reverse;
    button { width: 100%; }
  }
`;
