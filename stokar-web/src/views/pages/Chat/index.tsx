import { ArrowLeft, MessagesSquare, Send } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { useChatController } from '@/controllers/useChatController';
import type { ChatMessage, Conversation } from '@/models/types';
import { formatDate, formatRelative, formatTime, initials } from '@/utils/format';
import { Avatar, Button, EmptyState, Muted, PageHeader, SearchInput, Skeleton, Switch, Textarea } from '../../components/ui';
import * as S from './Chat.styles';

const displayName = (c: Conversation) => c.user?.name ?? 'Cliente';
const company = (c: Conversation) => c.customer?.tradeName || c.customer?.name;

/** Atendimento: mensagens enviadas pelos clientes no aplicativo. */
export function ChatPage() {
  const c = useChatController();
  const { thread } = c;
  const current = thread.conversation ?? c.conversations?.find((x) => x.id === c.selectedId) ?? null;

  return (
    <>
      <PageHeader>
        <div>
          <h1>Atendimento</h1>
          <p>Mensagens dos clientes pelo aplicativo. Qualquer pessoa da equipe pode responder.</p>
        </div>
      </PageHeader>

      <S.Layout $open={!!c.selectedId}>
        <S.Inbox aria-label="Conversas">
          <S.InboxHead>
            <SearchInput placeholder="Buscar cliente" value={c.search} onChange={(e) => c.setSearch(e.target.value)} />
            <label>
              <Switch checked={c.onlyUnread} onCheckedChange={c.setOnlyUnread} />
              <Muted>Só não lidas</Muted>
            </label>
          </S.InboxHead>

          {c.loadingInbox ? (
            <S.InboxList as="div">
              <Skeleton $h="56px" />
            </S.InboxList>
          ) : c.conversations && c.conversations.length > 0 ? (
            <S.InboxList>
              {c.conversations.map((conversation) => (
                <li key={conversation.id}>
                  <S.InboxItem type="button" $active={conversation.id === c.selectedId} onClick={() => c.select(conversation.id)}>
                    <Avatar $size={40}>{initials(displayName(conversation))}</Avatar>
                    <div>
                      <strong>{displayName(conversation)}</strong>
                      <p data-unread={conversation.unread > 0}>{conversation.lastMessagePreview}</p>
                    </div>
                    <S.ItemMeta>
                      {conversation.lastMessageAt && formatRelative(conversation.lastMessageAt)}
                      {conversation.unread > 0 && (
                        <S.Unread aria-label={`${conversation.unread} não lidas`}>{conversation.unread}</S.Unread>
                      )}
                    </S.ItemMeta>
                  </S.InboxItem>
                </li>
              ))}
            </S.InboxList>
          ) : (
            <S.Center>
              <EmptyState
                icon={<MessagesSquare />}
                title={c.hasFilters ? 'Nenhuma conversa encontrada' : 'Nenhuma mensagem ainda'}
                description={
                  c.hasFilters
                    ? 'Mude a busca ou o filtro.'
                    : 'Quando um cliente escrever pelo aplicativo, a conversa aparece aqui.'
                }
              />
            </S.Center>
          )}
        </S.Inbox>

        <S.Thread aria-label="Conversa">
          {c.selectedId && current ? (
            <>
              <S.ThreadHead>
                <Button variant="ghost" size="icon" aria-label="Voltar para as conversas" onClick={() => c.select(null)}>
                  <ArrowLeft />
                </Button>
                <Avatar $size={40}>{initials(displayName(current))}</Avatar>
                <div>
                  <strong>{displayName(current)}</strong>
                  <small>
                    {current.customerId && company(current) ? (
                      <Link to={`/clientes/${current.customerId}`}>{company(current)}</Link>
                    ) : (
                      current.user?.email
                    )}
                    {current.user?.phone ? ` · ${current.user.phone}` : ''}
                  </small>
                </div>
              </S.ThreadHead>
              <MessageList
                messages={thread.messages}
                loading={thread.loading}
                hasOlder={thread.hasOlder}
                onLoadOlder={thread.loadOlder}
              />
              <Composer sending={thread.sending} onSend={thread.send} />
            </>
          ) : (
            <S.Center>
              <EmptyState
                icon={<MessagesSquare />}
                title={c.selectedId ? 'Abrindo a conversa…' : 'Escolha uma conversa'}
                description={c.selectedId ? undefined : 'Selecione um cliente ao lado para ler e responder.'}
              />
            </S.Center>
          )}
        </S.Thread>
      </S.Layout>
    </>
  );
}

function MessageList(props: { messages: ChatMessage[]; loading: boolean; hasOlder: boolean; onLoadOlder: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const lastId = props.messages[props.messages.length - 1]?.id;

  // Rola para o fim sempre que chega (ou é enviada) uma mensagem nova
  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [lastId]);

  let previousDay = '';
  return (
    <S.Messages ref={box} role="log" aria-live="polite">
      {props.hasOlder && (
        <Button variant="ghost" size="sm" onClick={props.onLoadOlder} style={{ alignSelf: 'center' }}>
          Carregar mensagens anteriores
        </Button>
      )}
      {props.loading && props.messages.length === 0 && <Skeleton $h="48px" $w="60%" />}
      {!props.loading && props.messages.length === 0 && (
        <S.DayDivider>Nenhuma mensagem nesta conversa. Escreva para começar.</S.DayDivider>
      )}
      {props.messages.map((message) => {
        const day = formatDate(message.createdAt);
        const showDay = day !== previousDay;
        previousDay = day;
        return (
          <div key={message.id} style={{ display: 'contents' }}>
            {showDay && <S.DayDivider>{day}</S.DayDivider>}
            <S.Bubble $mine={message.fromStaff}>
              <p>{message.body}</p>
              <small>
                {message.fromStaff && message.sender ? `${message.sender.name} · ` : ''}
                {formatTime(message.createdAt)}
              </small>
            </S.Bubble>
          </div>
        );
      })}
    </S.Messages>
  );
}

function Composer(props: { sending: boolean; onSend: (body: string) => Promise<boolean> }) {
  const [text, setText] = useState('');

  const submit = async () => {
    if (!text.trim() || props.sending) return;
    if (await props.onSend(text)) setText('');
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter envia; Shift+Enter quebra a linha
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <S.Composer
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <Textarea
        rows={1}
        maxLength={4000}
        placeholder="Escreva uma resposta"
        aria-label="Mensagem"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <Button type="submit" loading={props.sending} disabled={!text.trim()} aria-label="Enviar mensagem">
        <Send /> Enviar
      </Button>
    </S.Composer>
  );
}
