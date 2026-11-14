import styled from 'styled-components';
import { media } from '@/styles/tokens';

type Series = 'in' | 'out';
const seriesColor = (s: Series) => (s === 'in' ? 'chartIn' : 'chartOut') as 'chartIn' | 'chartOut';

/* ---------- Leitura / legenda ---------- */
export const Readout = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => `${theme.space(1.5)} ${theme.space(5)}`};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  min-height: 28px;

  > strong {
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    color: ${({ theme }) => theme.colors.text};
  }
`;

export const LegendItem = styled.span<{ $series: Series }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};

  &::before {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ theme, $series }) => theme.colors[seriesColor($series)]};
  }
  b {
    font-family: ${({ theme }) => theme.font.display};
    font-size: ${({ theme }) => theme.fontSize.lg};
    font-weight: ${({ theme }) => theme.fontWeight.semibold};
    color: ${({ theme }) => theme.colors.text};
    font-variant-numeric: tabular-nums;
  }
`;

/* ---------- Gráfico de barras ---------- */
export const Chart = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: ${({ theme }) => theme.space(3)};
  height: 280px;
  margin-top: ${({ theme }) => theme.space(4)};

  ${media.mobile} { height: 230px; }
`;

export const YAxis = styled.div`
  display: flex;
  flex-direction: column-reverse;
  justify-content: space-between;
  padding-bottom: 28px;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.textSubtle};
  font-variant-numeric: tabular-nums;
  text-align: right;

  span { line-height: 1; transform: translateY(50%); }
  span:last-child { transform: translateY(0); }
`;

export const Plot = styled.div`
  position: relative;
  overflow-x: auto;
  scrollbar-width: thin;
`;

export const Grid = styled.div`
  position: absolute;
  inset: 0 0 28px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;

  i { height: 1px; background: ${({ theme }) => theme.colors.border}; opacity: 0.7; }
`;

export const Groups = styled.div`
  position: relative;
  display: flex;
  height: 100%;
  min-width: 100%;
  width: max-content;
`;

export const Group = styled.button<{ $active: boolean }>`
  flex: 1;
  min-width: 34px;
  display: flex;
  flex-direction: column;
  padding: 0 3px;
  border: 0;
  background: none;
  border-radius: ${({ theme }) => theme.radius.sm};

  span {
    height: 28px;
    display: grid;
    place-items: end center;
    font-size: ${({ theme }) => theme.fontSize.xs};
    color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.textSubtle)};
    font-weight: ${({ theme, $active }) => ($active ? theme.fontWeight.semibold : theme.fontWeight.regular)};
    white-space: nowrap;
  }
`;

export const Bars = styled.div`
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  width: 100%;
`;

/** Barra "listrada" com tampa sólida — as listras ganham cor quando o período está em foco. */
export const Bar = styled.i<{ $series: Series; $active: boolean; $height: number }>`
  flex: 1;
  max-width: 26px;
  min-height: 3px;
  height: ${({ $height }) => $height}%;
  border-top: 3px solid ${({ theme, $series }) => theme.colors[seriesColor($series)]};
  background: repeating-linear-gradient(
    90deg,
    ${({ theme, $series, $active }) => ($active ? theme.colors[seriesColor($series)] : theme.colors.chartTrack)} 0 2px,
    transparent 2px 4px
  );
  transition: height 400ms ease;
`;

/* ---------- Medidor (gauge) ---------- */
export const GaugeWrap = styled.div`
  position: relative;
  max-width: 340px;
  margin: 0 auto;

  svg { display: block; width: 100%; height: auto; overflow: visible; }
  .on { stroke: ${({ theme }) => theme.colors.primary}; }
  .off { stroke: ${({ theme }) => theme.colors.chartTrack}; }
`;

export const GaugeValue = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 4%;
  text-align: center;

  strong {
    display: block;
    font-family: ${({ theme }) => theme.font.display};
    font-size: ${({ theme }) => theme.fontSize['3xl']};
    font-weight: ${({ theme }) => theme.fontWeight.bold};
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  span { color: ${({ theme }) => theme.colors.textMuted}; font-size: ${({ theme }) => theme.fontSize.sm}; }
`;
