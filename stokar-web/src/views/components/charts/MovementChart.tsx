import { useState } from 'react';
import type { MovementSeriesPoint, SeriesGranularity } from '@/models/types';
import { formatCompact, formatQuantity } from '@/utils/format';
import * as S from './Charts.styles';

const asDate = (bucket: string) => new Date(`${bucket}T12:00:00`);

function shortLabel(bucket: string, granularity: SeriesGranularity) {
  const date = asDate(bucket);
  if (granularity === 'month') return date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  if (granularity === 'week') return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return date.toLocaleDateString('pt-BR', { day: '2-digit' });
}

function longLabel(bucket: string, granularity: SeriesGranularity) {
  const date = asDate(bucket);
  if (granularity === 'month') return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return granularity === 'week' ? `semana de ${day}` : day;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Arredonda o topo do eixo para um número "redondo" (1, 2, 2,5, 5 × 10ⁿ). */
function niceMax(value: number) {
  if (value <= 0) return 4;
  const pow = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 2.5, 5, 10].map((m) => m * pow).find((m) => m >= value) ?? value;
}

interface MovementChartProps {
  points: MovementSeriesPoint[];
  granularity: SeriesGranularity;
}

export function MovementChart({ points, granularity }: MovementChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const activeIndex = hovered !== null && hovered < points.length ? hovered : points.length - 1;
  const active = points[activeIndex];
  const max = niceMax(Math.max(0, ...points.flatMap((p) => [p.in, p.out])));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);

  return (
    <div>
      <S.Readout aria-live="polite">
        <strong>{active ? capitalize(longLabel(active.bucket, granularity)) : '—'}</strong>
        <S.LegendItem $series="in">
          Entradas <b>{formatQuantity(active?.in ?? 0)}</b>
        </S.LegendItem>
        <S.LegendItem $series="out">
          Saídas <b>{formatQuantity(active?.out ?? 0)}</b>
        </S.LegendItem>
      </S.Readout>

      <S.Chart>
        <S.YAxis aria-hidden>
          {ticks.map((t) => (
            <span key={t}>{formatCompact(t)}</span>
          ))}
        </S.YAxis>
        <S.Plot>
          <S.Grid aria-hidden>
            {ticks.map((t) => (
              <i key={t} />
            ))}
          </S.Grid>
          <S.Groups role="list" onMouseLeave={() => setHovered(null)}>
            {points.map((p, i) => (
              <S.Group
                key={p.bucket}
                role="listitem"
                $active={i === activeIndex}
                onMouseEnter={() => setHovered(i)}
                onFocus={() => setHovered(i)}
                onClick={() => setHovered(i)}
                aria-label={`${longLabel(p.bucket, granularity)}: ${formatQuantity(p.in)} de entrada, ${formatQuantity(p.out)} de saída`}
              >
                <S.Bars>
                  <S.Bar $series="in" $active={i === activeIndex} $height={(p.in / max) * 100} />
                  <S.Bar $series="out" $active={i === activeIndex} $height={(p.out / max) * 100} />
                </S.Bars>
                <span>{shortLabel(p.bucket, granularity)}</span>
              </S.Group>
            ))}
          </S.Groups>
        </S.Plot>
      </S.Chart>
    </div>
  );
}
