import { MessagesSquare, Send, WifiOff } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';
import type { useChatThread } from '@/controllers/useChatThread';
import type { ChatMessage } from '@/models/types';
import { formatDate, formatTime } from '@/utils/format';
import * as S from './ChatView.styles';
import { Button, EmptyState, Loading } from './ui';

interface ChatViewProps {
  thread: ReturnType<typeof useChatThread>;
  /** true quando quem usa o app é da equipe: as mensagens `fromStaff` ficam à direita. */
  staff: boolean;
  emptyText: string;
  /** Espaço da barra de abas quando a conversa é uma aba (evita cobrir o campo de texto). */
  keyboardOffset?: number;
  /** A tela já reserva a área segura inferior (ex.: está dentro das abas). */
  insideTabs?: boolean;
}

type Row = { kind: 'day'; key: string; label: string } | { kind: 'message'; key: string; message: ChatMessage };

/** Lista de mensagens + campo de envio. Usada na aba do cliente e na conversa aberta pela equipe. */
export function ChatView({ thread, staff, emptyText, keyboardOffset = 0, insideTabs }: ChatViewProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  // A lista é invertida (a mais recente embaixo), com um divisor a cada mudança de dia
  const rows = useMemo(() => {
    const result: Row[] = [];
    let previousDay = '';
    for (const message of thread.messages) {
      const day = formatDate(message.createdAt);
      if (day !== previousDay) result.push({ kind: 'day', key: `day-${day}`, label: day });
      previousDay = day;
      result.push({ kind: 'message', key: message.id, message });
    }
    return result.reverse();
  }, [thread.messages]);

  const submit = async () => {
    if (!text.trim() || thread.sending) return;
    if (await thread.send(text)) setText('');
  };

  if (thread.loading) return <Loading />;
  if (thread.failed) {
    return (
      <EmptyState
        icon={WifiOff}
        title="Não foi possível abrir a conversa"
        description="Verifique a internet e tente de novo."
        action={<Button label="Tentar de novo" variant="outline" fullWidth={false} onPress={thread.retry} />}
      />
    );
  }

  const disabled = !text.trim() || thread.sending;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardOffset}
    >
      <FlatList
        inverted={rows.length > 0}
        data={rows}
        keyExtractor={(row) => row.key}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: theme.space(4), flexGrow: 1 }}
        renderItem={({ item }) => {
          if (item.kind === 'day') return <S.DayDivider>{item.label}</S.DayDivider>;
          const { message } = item;
          const mine = message.fromStaff === staff;
          return (
            <S.Bubble $mine={mine}>
              <S.BubbleText $mine={mine} selectable>
                {message.body}
              </S.BubbleText>
              <S.BubbleMeta $mine={mine}>
                {staff && message.fromStaff && message.sender ? `${message.sender.name} · ` : ''}
                {formatTime(message.createdAt)}
              </S.BubbleMeta>
            </S.Bubble>
          );
        }}
        // Em lista invertida, o "rodapé" aparece no topo: é onde ficam as mensagens antigas
        ListFooterComponent={
          thread.hasOlder ? (
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <Button label="Carregar anteriores" variant="ghost" size="sm" fullWidth={false} onPress={() => void thread.loadOlder()} />
            </View>
          ) : undefined
        }
        ListEmptyComponent={<EmptyState icon={MessagesSquare} title="Nenhuma mensagem ainda" description={emptyText} />}
      />
      <S.Composer $inset={insideTabs ? 0 : insets.bottom}>
        <S.ComposerInput
          multiline
          maxLength={4000}
          placeholder="Escreva uma mensagem"
          placeholderTextColor={theme.colors.textSubtle}
          selectionColor={theme.colors.primary}
          accessibilityLabel="Mensagem"
          value={text}
          onChangeText={setText}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar mensagem"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={() => void submit()}
        >
          <S.SendButton $disabled={disabled}>
            {thread.sending ? (
              <ActivityIndicator size="small" color={theme.colors.primaryFg} />
            ) : (
              <Send size={20} color={theme.colors.primaryFg} />
            )}
          </S.SendButton>
        </Pressable>
      </S.Composer>
    </KeyboardAvoidingView>
  );
}
