import styled from 'styled-components';
import { media } from '@/styles/tokens';

/** Caixa de entrada à esquerda, conversa à direita. No celular, uma de cada vez. */
export const Layout = styled.div<{ $open: boolean }>`
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  height: calc(100dvh - 230px);
  min-height: 460px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => (theme.mode === 'dark' ? theme.colors.border : 'transparent')};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.card};
  overflow: hidden;

  ${media.mobile} {
    grid-template-columns: minmax(0, 1fr);
    height: calc(100dvh - 250px);
    > aside { display: ${({ $open }) => ($open ? 'none' : 'flex')}; }
    > section { display: ${({ $open }) => ($open ? 'flex' : 'none')}; }
  }
`;

export const Inbox = styled.aside`
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
`;

export const InboxHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(4)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  label { display: inline-flex; align-items: center; gap: ${({ theme }) => theme.space(2.5)}; }
  > div { max-width: none; }
`;

export const InboxList = styled.ul`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.space(2)};
`;

export const InboxItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  width: 100%;
  padding: ${({ theme }) => theme.space(3)};
  border: 0;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : 'none')};
  text-align: left;

  &:hover { background: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : theme.colors.surfaceInset)}; }

  > div { flex: 1; min-width: 0; }
  strong, p { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  strong { font-weight: ${({ theme }) => theme.fontWeight.semibold}; }
  p { font-size: ${({ theme }) => theme.fontSize.sm}; color: ${({ theme }) => theme.colors.textMuted}; }
  p[data-unread='true'] { color: ${({ theme }) => theme.colors.text}; font-weight: ${({ theme }) => theme.fontWeight.semibold}; }
`;

export const ItemMeta = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space(1)};
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.textSubtle};
`;

export const Unread = styled.span`
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: grid;
  place-items: center;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.primaryFg};
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const Thread = styled.section`
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
`;

export const ThreadHead = styled.header`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  > div { flex: 1; min-width: 0; }
  strong { display: block; font-weight: ${({ theme }) => theme.fontWeight.semibold}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  small { color: ${({ theme }) => theme.colors.textSubtle}; }
  small a { text-decoration: underline; }
  > button:first-child { display: none; }

  ${media.mobile} { > button:first-child { display: inline-flex; } }
`;

export const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(4)};
  background: ${({ theme }) => theme.colors.surfaceAlt};
`;

export const DayDivider = styled.span`
  align-self: center;
  margin: ${({ theme }) => theme.space(2)} 0;
  padding: ${({ theme }) => `${theme.space(1)} ${theme.space(3)}`};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.surfaceInset};
  color: ${({ theme }) => theme.colors.textSubtle};
  font-size: ${({ theme }) => theme.fontSize.xs};
`;

/** `$mine`: enviada pela equipe (lado direito). */
export const Bubble = styled.div<{ $mine: boolean }>`
  align-self: ${({ $mine }) => ($mine ? 'flex-end' : 'flex-start')};
  max-width: min(78%, 560px);
  padding: ${({ theme }) => `${theme.space(2.5)} ${theme.space(3.5)}`};
  border-radius: ${({ theme }) => theme.radius.lg};
  border-bottom-right-radius: ${({ theme, $mine }) => ($mine ? '4px' : theme.radius.lg)};
  border-bottom-left-radius: ${({ theme, $mine }) => ($mine ? theme.radius.lg : '4px')};
  background: ${({ theme, $mine }) => ($mine ? theme.colors.primary : theme.colors.surface)};
  color: ${({ theme, $mine }) => ($mine ? theme.colors.primaryFg : theme.colors.text)};
  border: 1px solid ${({ theme, $mine }) => ($mine ? 'transparent' : theme.colors.border)};

  p { white-space: pre-wrap; overflow-wrap: anywhere; }
  small { display: block; margin-top: 2px; text-align: right; font-size: ${({ theme }) => theme.fontSize.xs}; opacity: 0.75; }
`;

export const Composer = styled.form`
  display: flex;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space(2.5)};
  padding: ${({ theme }) => theme.space(3)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  textarea { min-height: 44px; max-height: 140px; resize: none; }
`;

export const Center = styled.div`
  flex: 1;
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.space(4)};
`;
