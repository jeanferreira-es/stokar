import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Wallet } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useTheme } from 'styled-components/native';
import { useAppData } from '@/contexts/AppDataContext';
import { formatCurrency } from '@/utils/format';
import * as S from '../screens/Requests/Requests.styles';
import { Fill, IconBubble, Muted, Row, Strong } from './ui';

/**
 * Tela inicial do cliente: quanto falta pagar à oficina.
 * Só aparece quando há valor pendente; tocar abre a tela com a chave PIX e os códigos.
 */
export function PaymentsSummary() {
  const navigation = useNavigation();
  const theme = useTheme();
  const { payments } = useAppData();

  if (!payments || payments.count === 0) return null;
  const hasPix = !!payments.pix.key;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Pagamentos pendentes: ${formatCurrency(payments.total)}. Ver como pagar`}
      onPress={() => navigation.navigate('Payments')}
      style={{ marginBottom: theme.space(3) }}
    >
      {({ pressed }) => (
        <S.PayCard $pressed={pressed}>
          <Row>
            <IconBubble icon={Wallet} tone="warning" size={38} />
            <Fill>
              <Strong>Pagamento pendente</Strong>
              <Muted>
                {payments.count === 1 ? '1 serviço' : `${payments.count} serviços`} aguardando pagamento
              </Muted>
            </Fill>
            <ChevronRight size={18} color={theme.colors.textSubtle} />
          </Row>
          <S.PayAmount>{formatCurrency(payments.total)}</S.PayAmount>
          <Muted>{hasPix ? 'Toque para pagar com PIX: a chave e o código com o valor já estão prontos.' : 'Toque para ver os detalhes e como pagar.'}</Muted>
        </S.PayCard>
      )}
    </Pressable>
  );
}
