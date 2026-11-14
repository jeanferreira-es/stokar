import { useNavigation } from '@react-navigation/native';
import { Bell } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useTheme } from 'styled-components/native';
import { useAppData } from '@/contexts/AppDataContext';
import * as S from '../screens/Requests/Requests.styles';
import { Counter } from './ui';

/** Atalho para as notificações, com o contador de não lidas. */
export function NotificationBell() {
  const navigation = useNavigation();
  const theme = useTheme();
  const { unreadNotifications } = useAppData();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unreadNotifications > 0 ? `Notificações, ${unreadNotifications} não lidas` : 'Notificações'}
      hitSlop={6}
      onPress={() => navigation.navigate('Notifications')}
    >
      {({ pressed }) => (
        <S.BellButton $pressed={pressed}>
          <Bell size={22} color={theme.colors.text} />
          <S.BellBadge>
            <Counter value={unreadNotifications} />
          </S.BellBadge>
        </S.BellButton>
      )}
    </Pressable>
  );
}
