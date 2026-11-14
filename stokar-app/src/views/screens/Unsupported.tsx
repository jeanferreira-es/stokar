import { MonitorSmartphone } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button, EmptyState, Screen } from '../components/ui';

/** Perfis internos sem função no aplicativo (ex.: solicitante do almoxarifado). */
export function UnsupportedScreen() {
  const { logout } = useAuth();
  return (
    <Screen topInset>
      <EmptyState
        icon={MonitorSmartphone}
        title="Seu perfil usa o site"
        description="O aplicativo é para os clientes e para a equipe da oficina. Para as solicitações internas, acesse o Stokar pelo navegador."
        action={<Button label="Sair" variant="outline" fullWidth={false} onPress={() => void logout()} />}
      />
    </Screen>
  );
}
