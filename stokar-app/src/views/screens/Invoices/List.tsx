import { FileText, ReceiptText } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useTheme } from 'styled-components/native';
import { useCurrentUser } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useList } from '@/controllers/useList';
import { isStaff } from '@/models/permissions';
import { invoicesService } from '@/models/services/api';
import { openInvoicePdf } from '@/models/services/invoicePdf';
import type { Invoice } from '@/models/types';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { Badge, Button, Card, EmptyState, Fill, Loading, Money, Muted, Row, Screen, Strong } from '../../components/ui';
import * as S from '../Requests/Requests.styles';

/** Notas de serviço: do cliente (as dele) ou, para a equipe, as últimas emitidas. */
export function InvoicesScreen() {
  const user = useCurrentUser();
  const theme = useTheme();
  const toast = useToast();
  const staff = isStaff(user);
  const list = useList(() => invoicesService.list({ limit: 50 }).then((r) => r.items));
  const [opening, setOpening] = useState<string | null>(null);

  const open = async (invoice: Invoice) => {
    setOpening(invoice.id);
    try {
      await openInvoicePdf(invoice);
    } catch (error) {
      toast.error(error);
    } finally {
      setOpening(null);
    }
  };

  if (list.loading) return <Loading />;
  return (
    <Screen scroll={false}>
      <FlatList
        data={list.items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: theme.space(4), gap: theme.space(3), flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={theme.colors.primary} />}
        renderItem={({ item }) => (
          <Card>
            <Row $between>
              <S.Code>{item.code}</S.Code>
              {item.status === 'CANCELLED' ? <Badge label="Cancelada" /> : <Money>{formatCurrency(item.total)}</Money>}
            </Row>
            <Fill>
              <Strong numberOfLines={2}>{item.reference.title}</Strong>
              <Muted>
                {[staff ? (item.recipient?.name ?? 'Cliente não identificado') : item.reference.vehicle, formatDateTime(item.issuedAt)]
                  .filter(Boolean)
                  .join(' · ')}
              </Muted>
            </Fill>
            <Button label="Abrir PDF" variant="secondary" icon={FileText} loading={opening === item.id} onPress={() => void open(item)} />
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={ReceiptText}
            title="Nenhuma nota ainda"
            description={
              staff
                ? 'Conclua um serviço e toque em "Emitir nota" na tela dele.'
                : 'Quando a oficina concluir um serviço e emitir a nota, ela aparece aqui.'
            }
          />
        }
      />
    </Screen>
  );
}
