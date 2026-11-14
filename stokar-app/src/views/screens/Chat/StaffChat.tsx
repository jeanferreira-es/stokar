import { useChatThread } from '@/controllers/useChatThread';
import type { RootScreenProps } from '@/navigation/types';
import { ChatView } from '../../components/ChatView';
import { Screen } from '../../components/ui';

/** Equipe: conversa aberta a partir da caixa de entrada. */
export function StaffChatScreen({ route }: RootScreenProps<'ChatThread'>) {
  const thread = useChatThread(route.params.conversationId);
  return (
    <Screen scroll={false}>
      <ChatView thread={thread} staff emptyText="Escreva para iniciar a conversa com o cliente." keyboardOffset={96} />
    </Screen>
  );
}
