import styled from 'styled-components';
import { media } from '@/styles/tokens';

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space(6)};
  align-items: start;

  ${media.tablet} { grid-template-columns: minmax(0, 1fr); gap: ${({ theme }) => theme.space(4)}; }
`;

export const Identity = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(4)};
  margin-bottom: ${({ theme }) => theme.space(5)};
  min-width: 0;

  div { min-width: 0; }
  strong { display: block; font-size: ${({ theme }) => theme.fontSize.lg}; font-weight: ${({ theme }) => theme.fontWeight.semibold}; }
  span { color: ${({ theme }) => theme.colors.textMuted}; overflow-wrap: anywhere; }
`;

export const Option = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => theme.space(4)} 0;

  & + & { border-top: 1px solid ${({ theme }) => theme.colors.border}; }
  &:first-of-type { padding-top: 0; }
  &:last-of-type { padding-bottom: 0; }

  strong { display: block; font-weight: ${({ theme }) => theme.fontWeight.semibold}; }
  span { font-size: ${({ theme }) => theme.fontSize.sm}; color: ${({ theme }) => theme.colors.textMuted}; }
`;

export const InlineForm = styled.form`
  display: flex;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space(3)};

  > div { flex: 1; }

  ${media.mobile} {
    flex-direction: column;
    align-items: stretch;
  }
`;
