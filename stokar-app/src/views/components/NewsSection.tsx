import { useNavigation } from '@react-navigation/native';
import { ChevronRight } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useTheme } from 'styled-components/native';
import { useAppData } from '@/contexts/AppDataContext';
import { useCurrentUser } from '@/contexts/AuthContext';
import { isStaff } from '@/models/permissions';
import { openNotificationTarget } from '@/navigation/openNotification';
import { formatRelative } from '@/utils/format';
import * as S from '../screens/Requests/Requests.styles';
import { notificationVisual } from './notificationVisual';
import { Button, Fill, IconBubble, Muted, Row, Stack, Strong } from './ui';

/**
 * "Novidades" no topo da tela inicial: o que mudou desde a última visita
 * (serviço aprovado, iniciado, concluído, nota emitida, resposta no chat).
 * Tocar abre o assunto e marca como lido; sem novidades, a seção não aparece.
 */
export function NewsSection() {
  const navigation = useNavigation();
  const theme = useTheme();
  const { news, unreadNotifications, markNotificationRead } = useAppData();
  const staff = isStaff(useCurrentUser());

  if (news.length === 0) return null;
  const more = unreadNotifications - news.length;

  return (
    <Stack $gap={2.5} style={{ marginBottom: theme.space(2) }}>
      <Row $between>
        <S.GroupTitle>Novidades</S.GroupTitle>
        {more > 0 && (
          <Button
            label={`Ver mais ${more}`}
            variant="ghost"
            size="sm"
            fullWidth={false}
            onPress={() => navigation.navigate('Notifications')}
          />
        )}
      </Row>
      {news.map((item) => {
        const visual = notificationVisual(item.type);
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.message}`}
            onPress={() => {
              markNotificationRead(item.id);
              openNotificationTarget(navigation, item, staff);
            }}
          >
            {({ pressed }) => (
              <S.NewsCard $pressed={pressed}>
                <IconBubble icon={visual.icon} tone={visual.tone} size={38} />
                <Fill>
                  <Strong numberOfLines={1}>{item.title}</Strong>
                  <Muted numberOfLines={2}>{item.message}</Muted>
                  <Muted>{formatRelative(item.createdAt)}</Muted>
                </Fill>
                <ChevronRight size={18} color={theme.colors.textSubtle} />
              </S.NewsCard>
            )}
          </Pressable>
        );
      })}
    </Stack>
  );
}
