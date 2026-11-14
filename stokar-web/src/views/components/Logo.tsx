import * as S from './Logo.styles';

interface LogoProps {
  size?: number;
  /** Só o símbolo, sem o nome (barra compacta e celular). */
  markOnly?: boolean;
}

/**
 * Símbolo do Stokar: um "S" desenhado como o caminho de um item pelo almoxarifado —
 * três prateleiras ligadas, com uma seta saindo no topo (saída) e outra entrando na base (entrada).
 */
export function Logo({ size = 40, markOnly }: LogoProps) {
  return (
    <S.Root aria-label="Stokar">
      <S.Mark $size={size} viewBox="0 0 48 48" fill="none" aria-hidden>
        <rect className="badge" width="48" height="48" rx="13" />
        <path className="route" d="M30 14.5H15.5V24h17v9.5H18" strokeWidth="5" strokeLinejoin="round" />
        <path className="arrow" d="M29 8.5l7 6-7 6z" />
        <path className="arrow" d="M19 27.5l-7 6 7 6z" />
      </S.Mark>
      {!markOnly && (
        <S.Wordmark $size={size} aria-hidden>
          Sto<b>k</b>ar
        </S.Wordmark>
      )}
    </S.Root>
  );
}
