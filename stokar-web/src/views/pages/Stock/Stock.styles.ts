import styled from 'styled-components';
import { media } from '@/styles/tokens';

export const PickerSlot = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  width: 260px;

  [role='combobox'] {
    background: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.radius.pill};
  }

  ${media.mobile} { width: 100%; }
`;

export const DateRange = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  color: ${({ theme }) => theme.colors.textSubtle};
  font-size: ${({ theme }) => theme.fontSize.sm};

  input {
    width: 150px;
    background: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.radius.pill};
  }

  ${media.mobile} {
    width: 100%;
    input { flex: 1; width: auto; min-width: 0; }
  }
`;

export const RequestLink = styled.a`
  color: ${({ theme }) => theme.colors.primaryText};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  text-decoration: underline;
  text-underline-offset: 3px;
`;
