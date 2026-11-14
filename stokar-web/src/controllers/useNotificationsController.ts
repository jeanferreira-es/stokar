import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { notificationsService } from '@/models/services/api';
import type { AppNotification } from '@/models/types';
import { keys, useAction } from './shared';

const POLL_MS = Number(import.meta.env.VITE_NOTIFICATIONS_POLL_MS) || 20_000;
const DESKTOP_KEY = 'stokar.desktopNotifications';

const countKey = [...keys.notifications, 'count'] as const;

/** Para onde a notificação leva, a partir do `data` gravado pela API. */
export function notificationTarget(n: AppNotification): string | null {
  const requestId = n.data?.serviceRequestId;
  if (typeof requestId === 'string') return `/solicitacoes/${requestId}`;
  const conversationId = n.data?.conversationId;
  if (typeof conversationId === 'string') return `/atendimento?conversa=${conversationId}`;
  if (n.type === 'LOW_STOCK' || n.type === 'OUT_OF_STOCK') return '/produtos?estoque=baixo';
  return null;
}

/* ---------- Notificações do sistema operacional (opcional) ---------- */
const desktopSupported = () => typeof window !== 'undefined' && 'Notification' in window;

function desktopEnabled() {
  try {
    return desktopSupported() && Notification.permission === 'granted' && localStorage.getItem(DESKTOP_KEY) === '1';
  } catch {
    return false;
  }
}

export function useDesktopNotifications() {
  const [enabled, setEnabled] = useState(desktopEnabled);

  const toggle = useCallback(async (next: boolean) => {
    if (!desktopSupported()) {
      toast.error('Este navegador não mostra notificações do sistema');
      return;
    }
    if (next && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Permissão negada. Libere as notificações nas configurações do navegador');
        return;
      }
    }
    localStorage.setItem(DESKTOP_KEY, next ? '1' : '0');
    setEnabled(next);
  }, []);

  return { supported: desktopSupported(), enabled, toggle };
}

/**
 * Recebe as notificações: consulta o contador leve da API em intervalo fixo e,
 * quando ele sobe, busca as novas e avisa com toast (e notificação do sistema, se ativada).
 * Deve ser montado uma única vez, no layout autenticado.
 */
export function useNotificationWatcher() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const previous = useRef<number | undefined>(undefined);
  const seen = useRef(new Set<string>());

  const { data: count } = useQuery({
    queryKey: countKey,
    queryFn: notificationsService.unreadCount,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (count === undefined) return;
    const before = previous.current;
    previous.current = count;
    if (before === undefined || count <= before) return;

    let cancelled = false;
    notificationsService
      .list({ unread: true, limit: Math.min(count - before, 5) })
      .then(({ items }) => {
        if (cancelled) return;
        client.invalidateQueries({ queryKey: keys.notifications });
        // Um alerta de estoque ou mudança de status também desatualiza estas telas
        client.invalidateQueries({ queryKey: keys.requests });
        client.invalidateQueries({ queryKey: keys.reports });

        for (const n of items) {
          if (seen.current.has(n.id)) continue;
          seen.current.add(n.id);
          const target = notificationTarget(n);

          toast(n.title, {
            description: n.message,
            action: target ? { label: 'Abrir', onClick: () => navigate(target) } : undefined,
          });

          if (desktopEnabled() && document.visibilityState === 'hidden') {
            const native = new Notification(n.title, { body: n.message, tag: n.id, icon: '/favicon.svg' });
            native.onclick = () => {
              window.focus();
              if (target) navigate(target);
            };
          }
        }
      })
      .catch(() => {
        /* a próxima consulta tenta de novo */
      });

    return () => {
      cancelled = true;
    };
  }, [count, client, navigate]);

  return count ?? 0;
}

/** Lista, leitura e remoção — usado pelo sininho e pela tela de notificações. */
export function useNotificationsController(options: { limit?: number; paginated?: boolean } = {}) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const limit = options.limit ?? 20;

  const list = useQuery({
    queryKey: [...keys.notifications, 'list', { page, limit, onlyUnread }],
    queryFn: () => notificationsService.list({ page, limit, unread: onlyUnread || undefined }),
    placeholderData: keepPreviousData,
  });

  const invalidate = [keys.notifications];
  const markRead = useAction(notificationsService.markRead, { invalidate });
  const markAllRead = useAction(notificationsService.markAllRead, {
    invalidate,
    success: 'Notificações marcadas como lidas',
  });
  const remove = useAction((id: string) => notificationsService.remove(id), {
    invalidate,
    success: 'Notificação removida',
  });

  const open = useCallback(
    (n: AppNotification) => {
      if (!n.readAt) markRead.mutate(n.id);
      const target = notificationTarget(n);
      if (target) navigate(target);
    },
    [markRead, navigate],
  );

  return {
    items: list.data?.items,
    meta: list.data?.meta,
    unreadCount: list.data?.unreadCount ?? 0,
    loading: list.isLoading,
    page,
    setPage,
    onlyUnread,
    setOnlyUnread: (value: boolean) => {
      setOnlyUnread(value);
      setPage(1);
    },
    open,
    markRead: (id: string) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
    markingAll: markAllRead.isPending,
    remove: (id: string) => remove.mutate(id),
  };
}
