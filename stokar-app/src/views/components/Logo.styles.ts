import styled from 'styled-components/native';

export const Root = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)}px;
`;

export const Wordmark = styled.Text<{ $size: number }>`
  font-family: ${({ theme }) => theme.fonts.displayBold};
  font-size: ${({ $size }) => Math.round($size * 0.62)}px;
  color: ${({ theme }) => theme.colors.text};
`;

/** o "k" em laranja marca o ponto onde entrada e saída se cruzam */
export const Accent = styled.Text`
  color: ${({ theme }) => theme.colors.primaryText};
`;
