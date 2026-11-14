import { Bell, CheckCheck } from 'lucide-react-native';
import { useEffect } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import { useAppData } from '@/contexts/AppDataContext';
import { useCurrentUser } from '@/contexts/AuthContext';
import { isStaff } from '@/models/permissions';
import { useToast } from '@/contexts/ToastContext';
import { useList } from '@/controllers/useList';
import { notificationsService } from '@/models/services/api';
import type { AppNotification } from '@/models/types';
import type { RootScreenProps } from '@/navigation/types';
import { openNotificationTarget } from '@/navigation/openNotification';
import { formatRelative } from '@/utils/format';
import { notificationVisual } from '../../components/notificationVisual';
import { Button, EmptyState, Group, ListItem, Loading, Muted, Screen } from '../../components/ui';

export function NotificationsScreen({ navigation }: RootScreenProps<'Notifications'>) {
  const theme = useTheme();
  const toast = useToast();
  const { refreshUnread } = useAppData();
  const staff = isStaff(useCurrentUser());
  const list = useList(() => notificationsService.list({ limit: 50 }).then((r) => r.items));
  const hasUnread = list.items.some((n) => !n.readAt);

  const markAll = async () => {
    try {
      await notificationsService.markAllRead();
      list.setItems((items) => items.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      refreshUnread();
    } catch (error) {
      toast.error(error);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: hasUnread
        ? () => <Button label="" accessibilityLabel="Marcar todas como lidas" variant="ghost" icon={CheckCheck} fullWidth={false} onPress={() => void markAll()} />
        : undefined,
    });
  }, [navigation, hasUnread]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (n: AppNotification) => {
    if (!n.readAt) {
      list.setItems((items) => items.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
      void notificationsService.markRead(n.id).then(refreshUnread).catch(() => {});
    }
    openNotificationTarget(navigation, n, staff);
  };

  if (list.loading) return <Loading />;
  return (
    <Screen scroll={false}>
      <FlatList
        data={list.items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: theme.space(4), flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={theme.colors.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: theme.space(2.5) }} />}
        renderItem={({ item }) => {
          const v = notificationVisual(item.type);
          return (
            <Group style={{ opacity: item.readAt ? 0.72 : 1 }}>
              <ListItem
                icon={v.icon}
                tone={v.tone}
                title={item.title}
                subtitle={item.message}
                chevron={false}
                right={
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Muted>{formatRelative(item.createdAt)}</Muted>
                    {!item.readAt && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary }} />}
                  </View>
                }
                onPress={() => open(item)}
              />
            </Group>
          );
        }}
        ListEmptyComponent={<EmptyState icon={Bell} title="Nenhuma notificação" description="Avisos sobre seus serviços, notas e mensagens aparecem aqui." />}
      />
    </Screen>
  );
}
