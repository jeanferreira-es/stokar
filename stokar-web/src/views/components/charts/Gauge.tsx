import * as S from './Charts.styles';

const TICKS = 61;
const CX = 120;
const CY = 120;
const R_IN = 78;
const R_OUT = 112;

interface GaugeProps {
  /** 0 a 100 */
  value: number;
  label: string;
}

/** Medidor em meia-lua feito de traços radiais, como um mostrador de bancada. */
export function Gauge({ value, label }: GaugeProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const filled = Math.round((clamped / 100) * (TICKS - 1));

  return (
    <S.GaugeWrap role="img" aria-label={`${label}: ${clamped.toFixed(1)}%`}>
      <svg viewBox="0 0 240 128">
        {Array.from({ length: TICKS }, (_, i) => {
          const angle = Math.PI - (i / (TICKS - 1)) * Math.PI;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const on = clamped > 0 && i <= filled;
          return (
            <line
              key={i}
              className={on ? 'on' : 'off'}
              x1={CX + R_IN * cos}
              y1={CY - R_IN * sin}
              x2={CX + R_OUT * cos}
              y2={CY - R_OUT * sin}
              strokeWidth={2.4}
              strokeLinecap="round"
              // as primeiras marcas começam mais claras, como no mostrador de referência
              opacity={on ? 0.45 + 0.55 * Math.min(1, i / 14) : 1}
            />
          );
        })}
      </svg>
      <S.GaugeValue>
        <strong>{clamped.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong>
        <span>{label}</span>
      </S.GaugeValue>
    </S.GaugeWrap>
  );
}
