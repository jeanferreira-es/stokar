import styled from 'styled-components';
import { media, palette } from '@/styles/tokens';

export const Screen = styled.div`
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);

  ${media.tablet} { grid-template-columns: minmax(0, 1fr); }
`;

/** Painel da marca: grafite fixo nos dois temas, como a parede do almoxarifado. */
export const Brand = styled.aside`
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => theme.space(10)};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${palette.steel[900]};
  color: #f1f3f5;

  h1 {
    max-width: 17ch;
    font-size: clamp(2.25rem, 4vw, 3.5rem);
    line-height: 1.02;
    letter-spacing: -0.01em;
  }
  p { margin-top: ${({ theme }) => theme.space(4)}; max-width: 38ch; color: ${palette.steel[400]}; }

  /* faixa zebrada no rodapé */
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 14px;
    background: repeating-linear-gradient(-45deg, ${palette.orange[500]} 0 14px, ${palette.steel[950]} 14px 28px);
  }

  ${media.tablet} { display: none; }
`;

export const BrandLogo = styled.div`
  color: #fff;
  > span { color: inherit; }
  b { color: ${palette.orange[400]}; }
`;

export const Flow = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  margin-bottom: ${({ theme }) => theme.space(6)};

  li {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.space(3)};
    color: ${palette.steel[300]};
  }
  svg { width: 20px; height: 20px; color: ${palette.orange[400]}; flex-shrink: 0; }
`;

export const Panel = styled.main`
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.space(6)};
`;

export const FormBox = styled.div`
  width: min(100%, 400px);

  h2 { font-size: ${({ theme }) => theme.fontSize['2xl']}; }
  > p { margin: ${({ theme }) => `${theme.space(1.5)} 0 ${theme.space(7)}`}; color: ${({ theme }) => theme.colors.textMuted}; }
`;

export const MobileLogo = styled.div`
  display: none;
  margin-bottom: ${({ theme }) => theme.space(8)};
  ${media.tablet} { display: block; }
`;

export const Switch = styled.p`
  margin-top: ${({ theme }) => theme.space(6)};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};

  a {
    color: ${({ theme }) => theme.colors.primaryText};
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;

export const FormError = styled.div`
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)}`};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.dangerSoft};
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

export const ThemeCorner = styled.div`
  position: fixed;
  top: ${({ theme }) => theme.space(5)};
  right: ${({ theme }) => theme.space(5)};
`;
