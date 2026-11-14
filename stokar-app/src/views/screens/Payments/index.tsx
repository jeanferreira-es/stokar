import { Copy, MessageCircle, QrCode, Wallet } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { useAppData } from '@/contexts/AppDataContext';
import { useToast } from '@/contexts/ToastContext';
import { PIX_KEY_TYPE_LABEL, STATUS_LABEL } from '@/models/labels';
import type { RootScreenProps } from '@/navigation/types';
import type { PendingPayment } from '@/models/types';
import { copyText } from '@/utils/clipboard';
import { formatCurrency, formatDate, vehicleLabel } from '@/utils/format';
import { Badge, Body, Button, Callout, Card, EmptyState, Fill, Loading, Money, Muted, Row, Screen, Strong, Subheading } from '../../components/ui';
import * as S from '../Requests/Requests.styles';

/**
 * Cliente: o que falta pagar e como pagar.
 * O PIX cai direto na conta da oficina; depois a oficina confirma e o cliente recebe um aviso.
 */
export function PaymentsScreen({ navigation }: RootScreenProps<'Payments'>) {
  const toast = useToast();
  const { payments, refreshPayments } = useAppData();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshPayments();
  }, [refreshPayments]);

  const copy = async (text: string, success: string) => {
    if (await copyText(text)) toast.success(success);
    else toast.error('Não foi possível copiar. Tente selecionar o texto.');
  };

  if (!payments) return <Loading />;

  const { pix } = payments;

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        refreshPayments();
        setTimeout(() => setRefreshing(false), 800);
      }}
    >
      {payments.count === 0 ? (
        <EmptyState icon={Wallet} title="Tudo em dia" description="Você não tem pagamentos pendentes com a oficina." />
      ) : (
        <>
          <Card>
            <Muted>Total a pagar</Muted>
            <S.PayAmount>{formatCurrency(payments.total)}</S.PayAmount>
            <Muted>{payments.count === 1 ? '1 serviço' : `${payments.count} serviços`}</Muted>
          </Card>

          {pix.key ? (
            <Card>
              <Subheading>Pagar com PIX</Subheading>
              <S.PixBox>
                <Muted>
                  Chave {pix.keyType ? PIX_KEY_TYPE_LABEL[pix.keyType].toLowerCase() : 'PIX'} · {pix.receiverName}
                </Muted>
                <S.PixKey selectable>{pix.key}</S.PixKey>
              </S.PixBox>
              <Button label="Copiar chave PIX" variant="secondary" icon={Copy} onPress={() => void copy(pix.key!, 'Chave PIX copiada')} />
              <Muted>
                Para já pagar com o valor certo, use o &quot;PIX copia e cola&quot; de cada serviço abaixo: no app do banco, escolha
                Pix › Copia e cola e cole o código.
              </Muted>
            </Card>
          ) : (
            <Callout icon={Wallet} tone="info" title="Como pagar">
              A oficina ainda não cadastrou uma chave PIX. Combine o pagamento pelo chat.
            </Callout>
          )}

          {pix.instructions ? (
            <Callout icon={MessageCircle} tone="neutral" title="Orientações da oficina">
              {pix.instructions}
            </Callout>
          ) : null}

          {payments.items.map((item) => (
            <PendingItem
              key={item.id}
              item={item}
              onOpen={() => navigation.navigate('RequestDetail', { id: item.id })}
              onCopy={(code) => void copy(code, `PIX de ${formatCurrency(item.total)} copiado`)}
            />
          ))}

          <Card>
            <Body>Depois de pagar, a oficina confere e confirma o pagamento. Você recebe um aviso aqui no aplicativo.</Body>
            <Button
              label="Enviar comprovante pelo chat"
              variant="outline"
              icon={MessageCircle}
              onPress={() => navigation.navigate('Tabs', { screen: 'Chat' })}
            />
          </Card>
        </>
      )}
    </Screen>
  );
}

function PendingItem({ item, onOpen, onCopy }: { item: PendingPayment; onOpen: () => void; onCopy: (code: string) => void }) {
  return (
    <Card>
      <Pressable accessibilityRole="button" accessibilityLabel={`Abrir o serviço ${item.code}`} onPress={onOpen}>
        <Row $between $top>
          <Fill>
            <S.Code>{item.code}</S.Code>
            <Strong numberOfLines={2}>{item.title}</Strong>
            {item.vehicle ? <Muted>{vehicleLabel(item.vehicle)}</Muted> : null}
            <Muted>{item.completedAt ? `Concluído em ${formatDate(item.completedAt)}` : STATUS_LABEL[item.status]}</Muted>
          </Fill>
          <Money>{formatCurrency(item.total)}</Money>
        </Row>
      </Pressable>
      {item.status !== 'COMPLETED' && <Badge label="O valor pode mudar até a conclusão" tone="warning" />}
      {item.pixCode ? (
        <Button label="Copiar PIX copia e cola" icon={QrCode} onPress={() => onCopy(item.pixCode!)} />
      ) : null}
    </Card>
  );
}
