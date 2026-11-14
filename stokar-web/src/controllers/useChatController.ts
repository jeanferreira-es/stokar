import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { isStaff } from '@/models/permissions';
import { chatService } from '@/models/services/api';
import { errorMessage } from '@/models/services/http';
import type { ChatMessage, Conversation } from '@/models/types';
import { useCurrentUser } from './AuthController';
import { keys, useDebounced } from './shared';

/** Intervalos de consulta: a API não tem WebSocket (roda em serverless). */
const INBOX_POLL_MS = Number(import.meta.env.VITE_CHAT_INBOX_POLL_MS) || 15_000;
const THREAD_POLL_MS = Number(import.meta.env.VITE_CHAT_THREAD_POLL_MS) || 4_000;

const unreadKey = [...keys.chat, 'unread'] as const;

/** Contador de mensagens de clientes ainda não lidas (menu lateral). */
export function useChatUnread() {
  const user = useCurrentUser();
  const { data } = useQuery({
    queryKey: unreadKey,
    queryFn: () => chatService.unreadCount(),
    enabled: isStaff(user),
    refetchInterval: INBOX_POLL_MS,
    refetchOnWindowFocus: true,
  });
  return data?.count ?? 0;
}

/** Junta mensagens novas às já carregadas, sem repetir e em ordem cronológica. */
function merge(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (incoming.length === 0) return current;
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Conversa aberta: carrega o histórico, consulta mensagens novas e envia. */
function useThread(conversationId: string | null) {
  const client = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const latest = useRef<string | undefined>(undefined);

  const refreshInbox = useCallback(() => {
    void client.invalidateQueries({ queryKey: keys.chat });
  }, [client]);

  useEffect(() => {
    setMessages([]);
    setConversation(null);
    latest.current = undefined;
    if (!conversationId) return;

    let active = true;
    setLoading(true);

    const apply = (result: { items: ChatMessage[]; conversation: Conversation }, initial: boolean) => {
      if (!active) return;
      setConversation(result.conversation);
      if (initial) setHasOlder(result.items.length >= 50);
      if (result.items.length > 0) {
        latest.current = result.items[result.items.length - 1].createdAt;
        setMessages((list) => merge(list, result.items));
      }
      // Com a conversa aberta, o que chegou já foi lido
      if (result.conversation.unread > 0) void chatService.markRead(conversationId).then(refreshInbox);
    };

    chatService
      .messages(conversationId, { limit: 50 })
      .then((result) => apply(result, true))
      .catch((error: unknown) => active && toast.error(errorMessage(error)))
      .finally(() => active && setLoading(false));

    const timer = setInterval(() => {
      if (document.hidden) return;
      chatService
        .messages(conversationId, latest.current ? { after: latest.current } : { limit: 50 })
        .then((result) => apply(result, false))
        .catch(() => {
          /* falha de rede no polling: tenta de novo no próximo ciclo */
        });
    }, THREAD_POLL_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [conversationId, refreshInbox]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || messages.length === 0) return;
    try {
      const result = await chatService.messages(conversationId, { before: messages[0].createdAt, limit: 50 });
      setHasOlder(result.items.length >= 50);
      setMessages((list) => merge(list, result.items));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }, [conversationId, messages]);

  const send = useCallback(
    async (body: string): Promise<boolean> => {
      if (!conversationId || !body.trim()) return false;
      setSending(true);
      try {
        const message = await chatService.send(conversationId, body.trim());
        latest.current = message.createdAt;
        setMessages((list) => merge(list, [message]));
        refreshInbox();
        return true;
      } catch (error) {
        toast.error(errorMessage(error));
        return false;
      } finally {
        setSending(false);
      }
    },
    [conversationId, refreshInbox],
  );

  return { messages, conversation, loading, hasOlder, loadOlder, send, sending };
}

/** Tela de atendimento: caixa de entrada à esquerda e conversa à direita. */
export function useChatController() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('conversa');
  const [search, setSearch] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const term = useDebounced(search);
  const filters = { search: term, unread: onlyUnread || undefined, limit: 50 };

  const inbox = useQuery({
    queryKey: [...keys.chat, 'inbox', filters],
    queryFn: () => chatService.conversations(filters),
    placeholderData: keepPreviousData,
    refetchInterval: INBOX_POLL_MS,
  });

  const thread = useThread(selectedId);

  return {
    conversations: inbox.data?.items,
    loadingInbox: inbox.isLoading,
    search,
    setSearch,
    onlyUnread,
    setOnlyUnread,
    hasFilters: !!term || onlyUnread,
    selectedId,
    select: (id: string | null) => setParams(id ? { conversa: id } : {}, { replace: !!selectedId && !!id }),
    thread,
  };
}
