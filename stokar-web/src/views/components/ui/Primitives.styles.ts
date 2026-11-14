import * as RadixSwitch from '@radix-ui/react-switch';
import styled, { css, keyframes } from 'styled-components';
import type { Tone } from '@/models/labels';
import { media } from '@/styles/tokens';

const tone = (t: Tone) => css`
  ${({ theme }) => {
    const c = theme.colors;
    const map: Record<Tone, [string, string]> = {
      neutral: [c.surfaceInset, c.textMuted],
      primary: [c.primarySoft, c.primaryText],
      success: [c.successSoft, c.success],
      warning: [c.warningSoft, c.warning],
      danger: [c.dangerSoft, c.danger],
      info: [c.infoSoft, c.info],
    };
    return `background: ${map[t][0]}; color: ${map[t][1]};`;
  }}
`;

/* ---------- Badge ---------- */
export const Badge = styled.span<{ $tone?: Tone }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1.5)};
  height: 24px;
  padding: 0 ${({ theme }) => theme.space(2.5)};
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  white-space: nowrap;
  ${({ $tone = 'neutral' }) => tone($tone)}

  svg { width: 13px; height: 13px; }
`;

/* ---------- Ícone em círculo (listas e cartões) ---------- */
export const IconBubble = styled.span<{ $tone?: Tone; $size?: number }>`
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: ${({ $size = 40 }) => $size}px;
  height: ${({ $size = 40 }) => $size}px;
  border-radius: 50%;
  ${({ $tone = 'neutral' }) => tone($tone)}

  svg { width: 45%; height: 45%; }
`;

/* ---------- Card ---------- */
export const Card = styled.section<{ $padded?: boolean }>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => (theme.mode === 'dark' ? theme.colors.border : 'transparent')};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.card};
  padding: ${({ theme, $padded = true }) => ($padded ? theme.space(6) : 0)};
  min-width: 0;

  ${media.mobile} {
    padding: ${({ theme, $padded = true }) => ($padded ? theme.space(4.5) : 0)};
    border-radius: ${({ theme }) => theme.radius.lg};
  }
`;

export const CardHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(3)};
  margin-bottom: ${({ theme }) => theme.space(5)};
`;

export const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSize.xl};
`;

/* ---------- Avatar ---------- */
export const Avatar = styled.span<{ $size?: number }>`
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: ${({ $size = 38 }) => $size}px;
  height: ${({ $size = 38 }) => $size}px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  font-family: ${({ theme }) => theme.font.display};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  font-size: ${({ $size = 38 }) => Math.round($size * 0.4)}px;
`;

/* ---------- Skeleton ---------- */
const shimmer = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

export const Skeleton = styled.span<{ $w?: string; $h?: string }>`
  display: block;
  width: ${({ $w = '100%' }) => $w};
  height: ${({ $h = '16px' }) => $h};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.surfaceInset} 25%,
    ${({ theme }) => theme.colors.border} 50%,
    ${({ theme }) => theme.colors.surfaceInset} 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s linear infinite;
`;

/* ---------- Switch ---------- */
export const SwitchRoot = styled(RadixSwitch.Root)`
  position: relative;
  flex-shrink: 0;
  width: 46px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.borderStrong};
  transition: background ${({ theme }) => theme.transition};

  &[data-state='checked'] { background: ${({ theme }) => theme.colors.primary}; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

export const SwitchThumb = styled(RadixSwitch.Thumb)`
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transform: translateX(3px);
  transition: transform ${({ theme }) => theme.transition};

  &[data-state='checked'] { transform: translateX(23px); }
`;

/* ---------- Abas de filtro (segmented) ---------- */
export const Segmented = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space(1)};
  padding: ${({ theme }) => theme.space(1)};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.pill};
  box-shadow: ${({ theme }) => theme.shadow.card};
  overflow-x: auto;
  scrollbar-width: none;
  max-width: 100%;

  &::-webkit-scrollbar { display: none; }
`;

export const SegmentedItem = styled.button<{ $active?: boolean }>`
  flex-shrink: 0;
  height: 34px;
  padding: 0 ${({ theme }) => theme.space(3.5)};
  border: 0;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  background: ${({ theme, $active }) => ($active ? theme.colors.text : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.colors.surface : theme.colors.textMuted)};
  transition: background ${({ theme }) => theme.transition}, color ${({ theme }) => theme.transition};

  &:hover { color: ${({ theme, $active }) => ($active ? theme.colors.surface : theme.colors.text)}; }
`;

/* ---------- Estado vazio ---------- */
export const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => `${theme.space(10)} ${theme.space(4)}`};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};

  strong {
    font-family: ${({ theme }) => theme.font.display};
    font-size: ${({ theme }) => theme.fontSize.lg};
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    color: ${({ theme }) => theme.colors.text};
  }
  p { max-width: 42ch; font-size: ${({ theme }) => theme.fontSize.sm}; }
`;

/* ---------- Cabeçalho de página e barra de filtros ---------- */
export const PageHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(4)};
  margin-bottom: ${({ theme }) => theme.space(6)};

  h1 { font-size: ${({ theme }) => theme.fontSize['2xl']}; line-height: 1.15; }
  p { margin-top: ${({ theme }) => theme.space(1)}; color: ${({ theme }) => theme.colors.textMuted}; }

  ${media.mobile} {
    margin-bottom: ${({ theme }) => theme.space(4)};
    h1 { font-size: ${({ theme }) => theme.fontSize.xl}; }
    p { font-size: ${({ theme }) => theme.fontSize.sm}; }
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2.5)};
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(3)};
  margin-bottom: ${({ theme }) => theme.space(4)};

  select {
    width: auto;
    min-width: 160px;
    border-radius: ${({ theme }) => theme.radius.pill};
    background-color: ${({ theme }) => theme.colors.surface};
  }

  ${media.mobile} {
    select { flex: 1; min-width: 0; }
  }
`;

export const Muted = styled.span`
  color: ${({ theme }) => theme.colors.textSubtle};
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

export const Stack = styled.div<{ $gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme, $gap = 4 }) => theme.space($gap)};
  min-width: 0;
`;
