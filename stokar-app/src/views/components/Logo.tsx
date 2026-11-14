import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme } from 'styled-components/native';
import * as S from './Logo.styles';

interface LogoProps {
  size?: number;
  /** Só o símbolo, sem o nome. */
  markOnly?: boolean;
}

/**
 * Símbolo do Stokar (o mesmo do site e do stokar-logo.svg): um "S" desenhado como o caminho
 * de um item pelo almoxarifado, com uma seta saindo no topo e outra entrando na base.
 */
export function Logo({ size = 40, markOnly }: LogoProps) {
  const { colors } = useTheme();
  return (
    <S.Root accessible accessibilityRole="image" accessibilityLabel="Stokar">
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Rect width={48} height={48} rx={13} fill={colors.primary} />
        <Path d="M30 14.5H15.5V24h17v9.5H18" stroke={colors.primaryFg} strokeWidth={5} strokeLinejoin="round" />
        <Path d="M29 8.5l7 6-7 6z" fill={colors.primaryFg} />
        <Path d="M19 27.5l-7 6 7 6z" fill={colors.primaryFg} />
      </Svg>
      {!markOnly && (
        <S.Wordmark $size={size}>
          Sto<S.Accent>k</S.Accent>ar
        </S.Wordmark>
      )}
    </S.Root>
  );
}
