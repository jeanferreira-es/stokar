import styled from 'styled-components/native';

/** Tipografia do app. Use estes componentes em vez do <Text> puro. */
export const Title = styled.Text`
  font-family: ${({ theme }) => theme.fonts.displayBold};
  font-size: ${({ theme }) => theme.fontSize['2xl']}px;
  color: ${({ theme }) => theme.colors.text};
`;

export const Heading = styled.Text`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: ${({ theme }) => theme.fontSize.xl}px;
  color: ${({ theme }) => theme.colors.text};
`;

export const Subheading = styled.Text`
  font-family: ${({ theme }) => theme.fonts.semibold};
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  color: ${({ theme }) => theme.colors.text};
`;

export const Body = styled.Text`
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.fontSize.md}px;
  line-height: 21px;
  color: ${({ theme }) => theme.colors.text};
`;

export const Strong = styled(Body)`
  font-family: ${({ theme }) => theme.fonts.semibold};
`;

export const Muted = styled.Text`
  font-family: ${({ theme }) => theme.fonts.regular};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Label = styled.Text`
  font-family: ${({ theme }) => theme.fonts.medium};
  font-size: ${({ theme }) => theme.fontSize.sm}px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Money = styled.Text`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: ${({ theme }) => theme.fontSize.lg}px;
  color: ${({ theme }) => theme.colors.text};
`;
