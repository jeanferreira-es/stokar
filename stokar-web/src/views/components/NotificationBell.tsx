import { Bell, BellOff } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationsController } from '@/controllers/useNotificationsController';
import type { AppNotification } from '@/models/types';
import { formatRelative } from '@/utils/format';
import { CircleButton, Dot } from '../layouts/AppLayout.styles';
import * as S from './NotificationBell.styles';
import { NOTIFICATION_VISUAL } from './notificationVisual';
import { Button, EmptyState, IconBubble, Popover, PopoverContent, PopoverTrigger, Skeleton } from './ui';

export function NotificationItem({ notification, onOpen }: { notification: AppNotification; onOpen: () => void }) {
  const { icon: Icon, tone } = NOTIFICATION_VISUAL[notification.type] ?? NOTIFICATION_VISUAL.REQUEST_CREATED;
  return (
    <S.Item $unread={!notification.readAt} onClick={onOpen}>
      <IconBubble $tone={tone} $size={38}>
        <Icon aria-hidden />
      </IconBubble>
      <S.ItemBody>
        <strong>{notification.title}</strong>
        <p>{notification.message}</p>
        <time dateTime={notification.createdAt}>{formatRelative(notification.createdAt)}</time>
      </S.ItemBody>
      {!notification.readAt && <S.UnreadDot aria-label="Não lida" />}
    </S.Item>
  );
}

export function NotificationBell({ unread }: { unread: number }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <CircleButton data-tour="notifications" aria-label={unread > 0 ? `Notificações: ${unread} não lidas` : 'Notificações'}>
          <Bell aria-hidden />
          {unread > 0 && <Dot aria-hidden>{unread > 9 ? '9+' : unread}</Dot>}
        </CircleButton>
      </PopoverTrigger>
      <PopoverContent width={400}>{open && <BellPanel onClose={() => setOpen(false)} />}</PopoverContent>
    </Popover>
  );
}

function BellPanel({ onClose }: { onClose: () => void }) {
  const c = useNotificationsController({ limit: 8 });

  return (
    <>
      <S.Head>
        <h2>Notificações</h2>
        {c.unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={c.markAllRead} loading={c.markingAll}>
            Marcar todas como lidas
          </Button>
        )}
      </S.Head>

      <S.List>
        {c.loading &&
          Array.from({ length: 4 }, (_, i) => (
            <li key={i} style={{ padding: 12 }}>
              <Skeleton $h="44px" />
            </li>
          ))}
        {c.items?.length === 0 && (
          <EmptyState
            icon={<BellOff />}
            title="Nenhuma notificação"
            description="Alertas de estoque e mudanças nas solicitações aparecem aqui."
          />
        )}
        {c.items?.map((n) => (
          <li key={n.id}>
            <NotificationItem
              notification={n}
              onOpen={() => {
                c.open(n);
                onClose();
              }}
            />
          </li>
        ))}
      </S.List>

      <S.Foot>
        <Button variant="ghost" size="sm" fullWidth asChild>
          <Link to="/notificacoes" onClick={onClose}>
            Ver todas as notificações
          </Link>
        </Button>
      </S.Foot>
    </>
  );
}
