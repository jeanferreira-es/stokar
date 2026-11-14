import styled from 'styled-components/native';

export const Root = styled.View`
  flex: 1;
  justify-content: flex-end;
`;

/** Fundo escurecido atrás do painel; tocar nele fecha. */
export const Backdrop = styled.Pressable`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: ${({ theme }) => theme.colors.overlay};
`;

export const Panel = styled.View<{ $inset: number }>`
  max-height: 86%;
  padding-bottom: ${({ theme, $inset }) => Math.max($inset, theme.space(4))}px;
  border-top-left-radius: ${({ theme }) => theme.radius.xl}px;
  border-top-right-radius: ${({ theme }) => theme.radius.xl}px;
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const Handle = styled.View`
  align-self: center;
  width: 40px;
  height: 4px;
  margin-top: ${({ theme }) => theme.space(2.5)}px;
  border-radius: 2px;
  background-color: ${({ theme }) => theme.colors.borderStrong};
`;

export const Header = styled.View`
  gap: ${({ theme }) => theme.space(1)}px;
  padding: ${({ theme }) => theme.space(4)}px ${({ theme }) => theme.space(4)}px ${({ theme }) => theme.space(2)}px;
`;

export const Body = styled.View`
  gap: ${({ theme }) => theme.space(3)}px;
  padding: ${({ theme }) => theme.space(2)}px ${({ theme }) => theme.space(4)}px;
`;
