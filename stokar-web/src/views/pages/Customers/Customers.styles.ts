import styled from 'styled-components';
import { media } from '@/styles/tokens';

export const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: ${({ theme }) => theme.space(6)};
  align-items: start;

  ${media.tablet} { grid-template-columns: minmax(0, 1fr); gap: ${({ theme }) => theme.space(4)}; }
`;

export const List = styled.ul`
  display: flex;
  flex-direction: column;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.space(3)};
    padding: ${({ theme }) => theme.space(3)} 0;
    min-width: 0;
  }
  li + li { border-top: 1px solid ${({ theme }) => theme.colors.border}; }
  li > div:first-child { min-width: 0; }
  strong { display: block; font-weight: ${({ theme }) => theme.fontWeight.semibold}; overflow-wrap: anywhere; }
  small { color: ${({ theme }) => theme.colors.textSubtle}; overflow-wrap: anywhere; }
  a:hover strong { color: ${({ theme }) => theme.colors.primaryText}; }
`;

export const RowEnd = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: ${({ theme }) => theme.space(1.5)};
`;

export const Note = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

export const Notes = styled.p`
  margin-top: ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => theme.space(3.5)};
  background: ${({ theme }) => theme.colors.surfaceInset};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.fontSize.sm};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;
