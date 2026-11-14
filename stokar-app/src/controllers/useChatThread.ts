import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAppData } from '@/contexts/AppDataContext';
import { useToast } from '@/contexts/ToastContext';
import { chatService } from '@/models/services/api';
import type { ChatMessage, Conversation } from '@/models/types';

/** Intervalo de consulta com a conversa aberta (a API não tem WebSocket). */
const POLL_MS = Number(process.env.EXPO_PUBLIC_CHAT_POLL_MS) || 4_000;
const PAGE = 50;

/** Junta mensagens novas às já carregadas, sem repetir e em ordem cronológica. */
function merge(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (incoming.length === 0) return current;
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Conversa aberta: histórico, mensagens novas (polling) e envio.
 * Sem `conversationId`, usa a conversa do próprio usuário com a oficina (perfil de cliente).
 */
export function useChatThread(conversationId?: string) {
  const toast = useToast();
  const { refreshUnread } = useAppData();
  const [id, setId] = useState<string | null>(conversationId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const latest = useRef<string | undefined>(undefined);

  // Cliente: descobre (ou cria) a própria conversa
  useEffect(() => {
    if (conversationId) return;
    let active = true;
    setFailed(false);
    chatService
      .mine()
      .then((mine) => active && setId(mine.id))
      .catch(() => {
        if (!active) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [conversationId, attempt]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    latest.current = undefined;
    setMessages([]);
    setLoading(true);
    setFailed(false);

    const apply = (result: { items: ChatMessage[]; conversation: Conversation }, initial: boolean) => {
      if (!active) return;
      setConversation(result.conversation);
      if (initial) setHasOlder(result.items.length >= PAGE);
      if (result.items.length > 0) {
        latest.current = result.items[result.items.length - 1].createdAt;
        setMessages((list) => merge(list, result.items));
      }
      // Com a conversa aberta, o que chegou já foi lido
      if (result.conversation.unread > 0) void chatService.markRead(id).then(refreshUnread).catch(() => {});
    };

    chatService
      .messages(id, { limit: PAGE })
      .then((result) => apply(result, true))
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false));

    const timer = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      chatService
        .messages(id, latest.current ? { after: latest.current } : { limit: PAGE })
        .then((result) => apply(result, false))
        .catch(() => {
          /* falha de rede no polling: tenta de novo no próximo ciclo */
        });
    }, POLL_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id, attempt, refreshUnread]);

  const loadOlder = useCallback(async () => {
    if (!id || messages.length === 0) return;
    try {
      const result = await chatService.messages(id, { before: messages[0].createdAt, limit: PAGE });
      setHasOlder(result.items.length >= PAGE);
      setMessages((list) => merge(list, result.items));
    } catch (error) {
      toast.error(error);
    }
  }, [id, messages, toast]);

  const send = useCallback(
    async (body: string): Promise<boolean> => {
      if (!id || !body.trim()) return false;
      setSending(true);
      try {
        const message = await chatService.send(id, body.trim());
        latest.current = message.createdAt;
        setMessages((list) => merge(list, [message]));
        return true;
      } catch (error) {
        toast.error(error);
        return false;
      } finally {
        setSending(false);
      }
    },
    [id, toast],
  );

  return { messages, conversation, loading, failed, retry: () => setAttempt((n) => n + 1), hasOlder, loadOlder, send, sending };
}
