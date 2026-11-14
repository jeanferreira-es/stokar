import { Car, UserRound } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useTheme } from 'styled-components/native';
import { STATUS_LABEL, STATUS_TONE } from '@/models/labels';
import type { ServiceRequest } from '@/models/types';
import { formatCurrency, formatRelative, vehicleLabel } from '@/utils/format';
import * as S from './RequestCard.styles';
import { Badge, Fill, Money, Muted, Row, Subheading } from './ui';

interface RequestCardProps {
  request: ServiceRequest;
  /** Equipe: mostra o cliente no cartão. */
  showCustomer?: boolean;
  onPress: () => void;
}

/** Cartão de um serviço nas listas. */
export function RequestCard({ request: r, showCustomer, onPress }: RequestCardProps) {
  const theme = useTheme();
  const customer = r.customer?.tradeName || r.customer?.name;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${r.title}, ${STATUS_LABEL[r.status]}`} onPress={onPress}>
      {({ pressed }) => (
        <S.Root $pressed={pressed}>
          <Row $between>
            <S.Code>{r.code}</S.Code>
            <Badge label={STATUS_LABEL[r.status]} tone={STATUS_TONE[r.status]} />
          </Row>
          <Subheading numberOfLines={2}>{r.title}</Subheading>
          {showCustomer && (
            <Row $gap={2}>
              <UserRound size={15} color={theme.colors.textSubtle} />
              <Muted numberOfLines={1} style={{ flex: 1 }}>
                {customer ?? 'Solicitação interna'}
              </Muted>
            </Row>
          )}
          {r.vehicle && (
            <Row $gap={2}>
              <Car size={15} color={theme.colors.textSubtle} />
              <Muted numberOfLines={1} style={{ flex: 1 }}>
                {vehicleLabel(r.vehicle)}
              </Muted>
            </Row>
          )}
          <Row $between>
            <Fill>
              <Muted>{formatRelative(r.createdAt)}</Muted>
            </Fill>
            {r.totals && r.totals.total > 0 ? <Money>{formatCurrency(r.totals.total)}</Money> : null}
          </Row>
        </S.Root>
      )}
    </Pressable>
  );
}
