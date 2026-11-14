import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MessagesSquare } from 'lucide-react-native';
import { useCallback, useEffect } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';
import { useAppData } from '@/contexts/AppDataContext';
import { useList } from '@/controllers/useList';
import { chatService } from '@/models/services/api';
import type { Conversation } from '@/models/types';
import { formatRelative } from '@/utils/format';
import { Avatar, Counter, EmptyState, Group, ListItem, Loading, Muted, Screen, Title } from '../../components/ui';
import * as S from '../Requests/Requests.styles';

const displayName = (c: Conversation) => c.user?.name ?? 'Cliente';

/** Aba "Conversas" da equipe: mensagens enviadas pelos clientes. */
export function InboxScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { unreadChat, refreshUnread } = useAppData();
  const list = useList(() => chatService.conversations({ limit: 50 }).then((r) => r.items));
  const { reload } = list;

  // Recarrega ao voltar para a aba e sempre que o contador global de não lidas mudar
  useFocusEffect(
    useCallback(() => {
      void reload();
      refreshUnread();
    }, [reload, refreshUnread]),
  );
  useEffect(() => {
    void reload();
  }, [unreadChat, reload]);

  return (
    <Screen scroll={false}>
      <S.Header $top={insets.top}>
        <Title>Conversas</Title>
      </S.Header>
      {list.loading ? (
        <Loading />
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: theme.space(4), paddingTop: 0, gap: theme.space(2.5), flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => (
            <Group>
              <ListItem
                left={<Avatar name={displayName(item)} />}
                title={displayName(item)}
                subtitle={[item.customer?.tradeName || item.customer?.name, item.lastMessagePreview].filter(Boolean).join(' · ')}
                chevron={false}
                right={
                  item.unread > 0 ? (
                    <Counter value={item.unread} />
                  ) : (
                    <Muted>{item.lastMessageAt ? formatRelative(item.lastMessageAt) : ''}</Muted>
                  )
                }
                onPress={() => navigation.navigate('ChatThread', { conversationId: item.id, title: displayName(item) })}
              />
            </Group>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={MessagesSquare}
              title="Nenhuma mensagem ainda"
              description="Quando um cliente escrever pelo aplicativo, a conversa aparece aqui e no site."
            />
          }
        />
      )}
    </Screen>
  );
}
