import { BellOff, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useNotificationsController } from '@/controllers/useNotificationsController';
import { NotificationItem } from '../../components/NotificationBell';
import {
  Button,
  Card,
  EmptyState,
  HeaderActions,
  PageHeader,
  Segmented,
  Skeleton,
  Toolbar,
} from '../../components/ui';
import * as S from './Notifications.styles';

export function NotificationsPage() {
  const c = useNotificationsController({ limit: 15 });

  return (
    <>
      <PageHeader>
        <div>
          <h1>Notificações</h1>
          <p>
            {c.unreadCount > 0
              ? `${c.unreadCount} ${c.unreadCount === 1 ? 'não lida' : 'não lidas'}`
              : 'Você está em dia com os avisos.'}
          </p>
        </div>
        {c.unreadCount > 0 && (
          <HeaderActions>
            <Button variant="secondary" onClick={c.markAllRead} loading={c.markingAll}>
              <CheckCheck /> Marcar todas como lidas
            </Button>
          </HeaderActions>
        )}
      </PageHeader>

      <Toolbar>
        <Segmented
          label="Filtro"
          value={c.onlyUnread ? 'unread' : 'all'}
          onChange={(v) => c.setOnlyUnread(v === 'unread')}
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'unread', label: 'Não lidas' },
          ]}
        />
      </Toolbar>

      <Card $padded={false}>
        {c.loading && (
          <S.List>
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} style={{ padding: 16 }}>
                <Skeleton $h="48px" />
              </li>
            ))}
          </S.List>
        )}

        {c.items?.length === 0 && (
          <EmptyState
            icon={<BellOff />}
            title={c.onlyUnread ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
            description="Você é avisado quando um produto chega ao estoque mínimo e quando uma solicitação muda de status."
          />
        )}

        {c.items && c.items.length > 0 && (
          <S.List>
            {c.items.map((n) => (
              <S.Entry key={n.id}>
                <NotificationItem notification={n} onOpen={() => c.open(n)} />
                <S.EntryActions>
                  {!n.readAt && (
                    <Button variant="ghost" size="icon" aria-label="Marcar como lida" onClick={() => c.markRead(n.id)}>
                      <Check />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" aria-label="Remover notificação" onClick={() => c.remove(n.id)}>
                    <Trash2 />
                  </Button>
                </S.EntryActions>
              </S.Entry>
            ))}
          </S.List>
        )}

        {c.meta && c.meta.totalPages > 1 && (
          <S.Pager>
            <Button variant="outline" size="sm" disabled={c.page <= 1} onClick={() => c.setPage(c.page - 1)}>
              Anteriores
            </Button>
            <span>
              Página {c.meta.page} de {c.meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={c.page >= c.meta.totalPages}
              onClick={() => c.setPage(c.page + 1)}
            >
              Próximas
            </Button>
          </S.Pager>
        )}
      </Card>
    </>
  );
}
