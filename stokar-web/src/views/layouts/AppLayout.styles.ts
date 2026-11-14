import { NavLink } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { media } from '@/styles/tokens';

const SIDEBAR = '232px';
const RAIL = '68px';

export const Shell = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space(5)};
  display: grid;
  grid-template-columns: ${SIDEBAR} minmax(0, 1fr);
  grid-template-rows: auto 1fr;
  grid-template-areas: 'top top' 'side main';
  gap: ${({ theme }) => theme.space(6)};
  min-height: 100dvh;

  ${media.tablet} {
    grid-template-columns: ${RAIL} minmax(0, 1fr);
    gap: ${({ theme }) => theme.space(5)};
    padding: ${({ theme }) => theme.space(4)};
  }
  ${media.mobile} {
    display: block;
    padding: ${({ theme }) => theme.space(3)};
    padding-bottom: calc(84px + env(safe-area-inset-bottom));
  }
`;

/* ---------- Barra superior ---------- */
export const TopBar = styled.header`
  grid-area: top;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(4)};
  height: 72px;
  padding: 0 ${({ theme }) => theme.space(3)} 0 ${({ theme }) => theme.space(4)};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => (theme.mode === 'dark' ? theme.colors.border : 'transparent')};
  border-radius: ${({ theme }) => theme.radius.pill};
  box-shadow: ${({ theme }) => theme.shadow.card};

  ${media.mobile} {
    height: 60px;
    gap: ${({ theme }) => theme.space(2)};
    padding: 0 ${({ theme }) => theme.space(2)} 0 ${({ theme }) => theme.space(2.5)};
    margin-bottom: ${({ theme }) => theme.space(4)};
  }
`;

export const BrandFull = styled.span`
  display: inline-flex;
  ${media.mobile} { display: none; }
`;
export const BrandMark = styled.span`
  display: none;
  ${media.mobile} { display: inline-flex; }
`;

/** "Aba" com a seção atual, como a aba ativa do layout de referência. */
export const Section = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
  height: 44px;
  padding: 0 ${({ theme }) => theme.space(5)};
  margin-left: ${({ theme }) => theme.space(4)};
  background: ${({ theme }) => theme.colors.bg};
  border-radius: ${({ theme }) => theme.radius.pill};
  font-family: ${({ theme }) => theme.font.display};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  font-size: ${({ theme }) => theme.fontSize.lg};
  min-width: 0;

  svg { width: 18px; height: 18px; color: ${({ theme }) => theme.colors.primaryText}; flex-shrink: 0; }
  span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  ${media.mobile} {
    margin-left: 0;
    padding: 0 ${({ theme }) => theme.space(3)};
    height: 38px;
    font-size: ${({ theme }) => theme.fontSize.md};
    background: transparent;
  }
`;

export const Spacer = styled.div`
  flex: 1;
`;

export const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`;

export const CircleButton = styled.button`
  position: relative;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 0;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  transition: background ${({ theme }) => theme.transition};

  svg { width: 20px; height: 20px; }
  &:hover { background: ${({ theme }) => theme.colors.border}; }

  ${media.mobile} { width: 42px; height: 42px; }
`;

export const ThemeToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 2px;
  height: 46px;
  padding: 4px;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.bg};

  span {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    color: ${({ theme }) => theme.colors.textSubtle};
    transition: background ${({ theme }) => theme.transition}, color ${({ theme }) => theme.transition};
  }
  span[data-active='true'] {
    background: ${({ theme }) => theme.colors.text};
    color: ${({ theme }) => theme.colors.surface};
  }
  svg { width: 18px; height: 18px; }

  ${media.mobile} {
    height: 42px;
    span { width: 34px; height: 34px; }
    span[data-active='false'] { display: none; }
  }
`;

export const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
  height: 54px;
  padding: 0 ${({ theme }) => theme.space(3)} 0 ${({ theme }) => theme.space(2)};
  border: 0;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.bg};
  text-align: left;

  div { display: flex; flex-direction: column; line-height: 1.2; }
  small { font-size: ${({ theme }) => theme.fontSize.xs}; color: ${({ theme }) => theme.colors.textSubtle}; }
  strong { font-size: ${({ theme }) => theme.fontSize.sm}; font-weight: ${({ theme }) => theme.fontWeight.semibold}; }
  > svg { width: 16px; height: 16px; color: ${({ theme }) => theme.colors.textSubtle}; }

  ${media.tablet} {
    padding: 0;
    height: auto;
    background: none;
    div, > svg { display: none; }
  }
`;

/* ---------- Menu lateral ---------- */
export const Side = styled.nav`
  grid-area: side;
  position: sticky;
  top: ${({ theme }) => theme.space(5)};
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};

  ${media.mobile} { display: none; }
`;

export const SideGroup = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1)};
  padding: ${({ theme }) => theme.space(2.5)};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => (theme.mode === 'dark' ? theme.colors.border : 'transparent')};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.card};

  ${media.tablet} {
    border-radius: ${({ theme }) => theme.radius.pill};
    padding: ${({ theme }) => theme.space(2)};
    align-items: center;
  }
`;

export const SideLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  height: 46px;
  padding: 0 ${({ theme }) => theme.space(3.5)};
  border-radius: ${({ theme }) => theme.radius.pill};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  transition: background ${({ theme }) => theme.transition}, color ${({ theme }) => theme.transition};

  svg { width: 20px; height: 20px; flex-shrink: 0; }

  &:hover { background: ${({ theme }) => theme.colors.surfaceInset}; color: ${({ theme }) => theme.colors.text}; }
  &.active {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primaryFg};
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
  }

  ${media.tablet} {
    width: 46px;
    padding: 0;
    justify-content: center;
    span:not([data-count]) { display: none; }
  }
`;

export const Count = styled.span`
  margin-left: auto;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  display: grid;
  place-items: center;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.bold};

  ${media.tablet} { display: none; }
`;

export const Dot = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: grid;
  place-items: center;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.primaryFg};
  border: 2px solid ${({ theme }) => theme.colors.surface};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  line-height: 1;
`;

export const Main = styled.main`
  grid-area: main;
  min-width: 0;
  padding-bottom: ${({ theme }) => theme.space(8)};
`;

/* ---------- Navegação inferior (celular) ---------- */
export const BottomNav = styled.nav`
  display: none;

  ${media.mobile} {
    position: fixed;
    z-index: ${({ theme }) => theme.z.nav};
    left: ${({ theme }) => theme.space(3)};
    right: ${({ theme }) => theme.space(3)};
    bottom: calc(${({ theme }) => theme.space(3)} + env(safe-area-inset-bottom));
    display: flex;
    justify-content: space-around;
    padding: ${({ theme }) => theme.space(1.5)};
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.pill};
    box-shadow: ${({ theme }) => theme.shadow.pop};
  }
`;

const bottomItem = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 52px;
  border: 0;
  background: none;
  border-radius: ${({ theme }) => theme.radius.pill};
  color: ${({ theme }) => theme.colors.textSubtle};
  font-size: 0.6875rem;
  font-weight: ${({ theme }) => theme.fontWeight.medium};

  svg { width: 20px; height: 20px; }

  &.active {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primaryFg};
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
  }
`;

export const BottomLink = styled(NavLink)`
  ${bottomItem}
`;

export const BottomButton = styled.button`
  ${bottomItem}
`;

export const MoreList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1)};

  a {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.space(3)};
    height: 52px;
    padding: 0 ${({ theme }) => theme.space(3)};
    border-radius: ${({ theme }) => theme.radius.md};
    font-weight: ${({ theme }) => theme.fontWeight.medium};
  }
  a.active { background: ${({ theme }) => theme.colors.primarySoft}; color: ${({ theme }) => theme.colors.primaryText}; }
  svg { width: 20px; height: 20px; }
`;

export const FullScreen = styled.div`
  min-height: 100dvh;
  display: grid;
  place-items: center;
`;
