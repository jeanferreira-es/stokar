import styled from 'styled-components';

export const Root = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
  color: ${({ theme }) => theme.colors.text};
`;

export const Mark = styled.svg<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  flex-shrink: 0;

  .badge { fill: ${({ theme }) => theme.colors.primary}; }
  .route { stroke: ${({ theme }) => theme.colors.primaryFg}; }
  .arrow { fill: ${({ theme }) => theme.colors.primaryFg}; }
`;

export const Wordmark = styled.span<{ $size: number }>`
  font-family: ${({ theme }) => theme.font.display};
  font-weight: 700;
  font-size: ${({ $size }) => Math.round($size * 0.62)}px;
  letter-spacing: -0.01em;
  line-height: 1;

  /* o "k" em laranja marca o ponto onde entrada e saída se cruzam */
  b { font-weight: inherit; color: ${({ theme }) => theme.colors.primaryText}; }
`;
