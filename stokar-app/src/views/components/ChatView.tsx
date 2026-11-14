import { MessagesSquare, Send, WifiOff } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode, type RefObject } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  View,
  type KeyboardEvent,
} from 'react-native';
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
  /** A tela já reserva a área segura inferior (ex.: está dentro das abas). */
  insideTabs?: boolean;
}

type Row = { kind: 'day'; key: string; label: string } | { kind: 'message'; key: string; message: ChatMessage };

/**
 * Quanto do componente o teclado cobre, medido na janela. Funciona igual com barra de abas, cabeçalho
 * ou tela de ponta a ponta (Android), onde a janela não encolhe sozinha quando o teclado abre.
 */
function useKeyboardOverlap(ref: RefObject<ComponentRef<typeof View> | null>) {
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const animate = (event?: KeyboardEvent) => {
      if (ios && event?.duration) {
        LayoutAnimation.configureNext({
          duration: event.duration,
          update: { type: LayoutAnimation.Types.keyboard },
        });
      }
    };
    const show = (event: KeyboardEvent) => {
      const keyboardTop = event.endCoordinates.screenY;
      ref.current?.measureInWindow((_x, y, _width, height) => {
        animate(event);
        setOverlap(Math.max(y + height - keyboardTop, 0));
      });
    };
    const hide = (event: KeyboardEvent) => {
      animate(event);
      setOverlap(0);
    };
    const subscriptions = ios
      ? [Keyboard.addListener('keyboardWillChangeFrame', show), Keyboard.addListener('keyboardWillHide', hide)]
      : [Keyboard.addListener('keyboardDidShow', show), Keyboard.addListener('keyboardDidHide', hide)];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [ref]);

  return overlap;
}

/** Balão que surge subindo e crescendo levemente. `animate: false` quando já apareceu antes (ex.: voltou ao rolar). */
function AppearingBubble({ animate, mine, children }: { animate: boolean; mine: boolean; children: ReactNode }) {
  const progress = useRef(new Animated.Value(animate ? 0 : 1)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.spring(progress, {
      toValue: 1,
      damping: 16,
      stiffness: 200,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [animate, progress]);

  return (
    <Animated.View
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '82%',
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 0],
            }),
          },
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

/** Lista de mensagens + campo de envio. Usada na aba do cliente e na conversa aberta pela equipe. */
export function ChatView({ thread, staff, emptyText, insideTabs }: ChatViewProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const rootRef = useRef<ComponentRef<typeof View>>(null);
  const keyboardOverlap = useKeyboardOverlap(rootRef);
  /** Mensagens que já tiveram a animação de entrada (a lista recria os balões ao rolar). */
  const appeared = useRef(new Set<string>()).current;

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
    <View ref={rootRef} style={{ flex: 1, paddingBottom: keyboardOverlap }}>
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
          const animate = !appeared.has(message.id);
          appeared.add(message.id);
          return (
            <AppearingBubble animate={animate} mine={mine}>
              <S.Bubble $mine={mine}>
                <S.BubbleText $mine={mine} selectable>
                  {message.body}
                </S.BubbleText>
                <S.BubbleMeta $mine={mine}>
                  {staff && message.fromStaff && message.sender ? `${message.sender.name} · ` : ''}
                  {formatTime(message.createdAt)}
                </S.BubbleMeta>
              </S.Bubble>
            </AppearingBubble>
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
      <S.Composer $inset={insideTabs || keyboardOverlap > 0 ? 0 : insets.bottom}>
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
    </View>
  );
}
