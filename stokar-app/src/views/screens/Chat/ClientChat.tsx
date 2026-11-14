import { Phone } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/AppDataContext';
import { useChatThread } from '@/controllers/useChatThread';
import { ChatView } from '../../components/ChatView';
import { Button, Fill, Muted, Row, Screen, Title } from '../../components/ui';
import * as S from '../Requests/Requests.styles';

/** Aba "Chat" do cliente: a conversa dele com a oficina. */
export function ClientChatScreen() {
  const thread = useChatThread();
  const { company } = useAppData();
  const insets = useSafeAreaInsets();

  return (
    <Screen scroll={false} avoidKeyboard={false}>
      <S.Header $top={insets.top}>
        <Row $between>
          <Fill>
            <Title>{company?.name ?? 'Oficina'}</Title>
            <Muted>Fale com a equipe. Respondemos por aqui.</Muted>
          </Fill>
          {company?.phone ? (
            <Button
              label=""
              accessibilityLabel={`Ligar para a oficina: ${company.phone}`}
              variant="secondary"
              icon={Phone}
              fullWidth={false}
              onPress={() => void Linking.openURL(`tel:${company.phone!.replace(/[^\d+]/g, '')}`)}
            />
          ) : null}
        </Row>
      </S.Header>
      <ChatView
        thread={thread}
        staff={false}
        insideTabs
        emptyText="Tire dúvidas, peça um orçamento ou combine a entrega do veículo."
      />
    </Screen>
  );
}
