import styled from 'styled-components/native';

export const Hero = styled.View`
  align-items: center;
  gap: ${({ theme }) => theme.space(3)}px;
  padding: ${({ theme }) => theme.space(8)}px 0 ${({ theme }) => theme.space(4)}px;
`;

export const Tagline = styled.Text`
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.fontSize.md}px;
  line-height: 21px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Legal = styled.Text`
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.fontSize.xs}px;
  line-height: 17px;
  color: ${({ theme }) => theme.colors.textSubtle};
`;

export const Link = styled.Text`
  font-family: ${({ theme }) => theme.fonts.semibold};
  color: ${({ theme }) => theme.colors.primaryText};
  text-decoration-line: underline;
`;
