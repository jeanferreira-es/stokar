import type { NavigationProp } from '@react-navigation/native';
import type { AppNotification } from '@/models/types';
import type { RootStackParamList } from './types';

/** Leva o usuário ao assunto da notificação: o serviço, as notas ou o chat. */
export function openNotificationTarget(
  navigation: Pick<NavigationProp<RootStackParamList>, 'navigate'>,
  notification: AppNotification,
  /** Quem está usando o app é da equipe da oficina */
  staff: boolean,
): void {
  const requestId = notification.data?.serviceRequestId;
  if (typeof requestId === 'string') {
    navigation.navigate('RequestDetail', { id: requestId });
    return;
  }
  if (notification.type === 'INVOICE_ISSUED') {
    navigation.navigate('Invoices');
    return;
  }
  if (notification.type === 'CHAT_MESSAGE') {
    const conversationId = notification.data?.conversationId;
    // Equipe: abre a conversa daquele cliente. Cliente: vai para a aba Chat.
    if (staff && typeof conversationId === 'string') {
      const name = notification.title.replace(/^Nova mensagem de /, '');
      navigation.navigate('ChatThread', { conversationId, title: name || 'Conversa' });
    } else {
      navigation.navigate('Tabs', { screen: 'Chat' });
    }
  }
}
