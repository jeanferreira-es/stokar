import styled from 'styled-components';

export const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => `${theme.space(4)} ${theme.space(4)} ${theme.space(2)} ${theme.space(5)}`};

  h2 { font-size: ${({ theme }) => theme.fontSize.lg}; }
`;

export const List = styled.ul`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.space(2)};
`;

export const Item = styled.button<{ $unread: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space(3)};
  width: 100%;
  padding: ${({ theme }) => theme.space(3)};
  border: 0;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme, $unread }) => ($unread ? theme.colors.surfaceAlt : 'transparent')};
  text-align: left;
  transition: background ${({ theme }) => theme.transition};

  &:hover { background: ${({ theme }) => theme.colors.surfaceInset}; }
`;

export const ItemBody = styled.div`
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSize.sm};
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
  }
  p {
    margin-top: 2px;
    font-size: ${({ theme }) => theme.fontSize.sm};
    color: ${({ theme }) => theme.colors.textMuted};
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  time {
    display: block;
    margin-top: ${({ theme }) => theme.space(1)};
    font-size: ${({ theme }) => theme.fontSize.xs};
    color: ${({ theme }) => theme.colors.textSubtle};
  }
`;

export const UnreadDot = styled.span`
  flex-shrink: 0;
  width: 9px;
  height: 9px;
  margin-top: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
`;

export const Foot = styled.div`
  padding: ${({ theme }) => theme.space(2)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;
