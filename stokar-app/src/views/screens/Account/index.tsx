import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Bell, Car, KeyRound, LogOut, MapPin, Phone, ReceiptText, ShieldCheck, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth, useCurrentUser } from '@/contexts/AuthContext';
import { useThemeMode, type ThemePreference } from '@/contexts/ThemeContext';
import { ROLE_LABEL } from '@/models/labels';
import { isClient } from '@/models/permissions';
import { APP_VERSION, PRIVACY_POLICY_URL } from '@/utils/config';
import { Logo } from '../../components/Logo';
import {
  Avatar,
  Button,
  Card,
  Counter,
  Divider,
  Field,
  Fill,
  Group,
  ListItem,
  Muted,
  Row,
  Screen,
  Segmented,
  Sheet,
  SheetBody,
  Subheading,
  Title,
} from '../../components/ui';

/** Aba "Conta": perfil, atalhos, aparência e contato da oficina. */
export function AccountScreen() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const { company, profile, unreadNotifications } = useAppData();
  const { preference, setPreference } = useThemeMode();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const client = isClient(user);

  return (
    <Screen topInset>
      <Title style={{ marginTop: insets.top > 0 ? 0 : 8 }}>Conta</Title>

      <Card>
        <Row>
          <Avatar name={user.name} size={52} />
          <Fill>
            <Subheading numberOfLines={1}>{user.name}</Subheading>
            <Muted numberOfLines={1}>{user.email}</Muted>
            <Muted numberOfLines={1}>{client ? (profile?.tradeName || profile?.name) ?? 'Cliente' : ROLE_LABEL[user.role]}</Muted>
          </Fill>
        </Row>
      </Card>

      <Group>
        <ListItem icon={UserRound} title="Meus dados" subtitle={client ? 'Nome, telefone e cadastro' : 'Nome e telefone'} onPress={() => navigation.navigate('Profile')} />
        <Divider />
        {client && (
          <>
            <ListItem icon={Car} title="Meus veículos" subtitle={`${profile?.vehicles.filter((v) => v.active).length ?? 0} cadastrados`} onPress={() => navigation.navigate('Vehicles')} />
            <Divider />
          </>
        )}
        <ListItem icon={ReceiptText} title="Notas de serviço" subtitle="Abra e compartilhe os PDFs" onPress={() => navigation.navigate('Invoices')} />
        <Divider />
        <ListItem
          icon={Bell}
          title="Notificações"
          right={<Counter value={unreadNotifications} />}
          chevron
          onPress={() => navigation.navigate('Notifications')}
        />
        <Divider />
        <ListItem icon={KeyRound} title="Trocar senha" onPress={() => navigation.navigate('ChangePassword')} />
      </Group>

      <Card>
        <Field label="Aparência">
          <Segmented<ThemePreference>
            value={preference}
            onChange={setPreference}
            options={[
              { value: 'system', label: 'Do aparelho' },
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Escuro' },
            ]}
          />
        </Field>
      </Card>

      {client && company && (company.phone || company.address) && (
        <Group>
          {company.phone ? (
            <ListItem
              icon={Phone}
              title={`Ligar para ${company.name}`}
              subtitle={company.phone}
              onPress={() => void Linking.openURL(`tel:${company.phone!.replace(/[^\d+]/g, '')}`)}
            />
          ) : null}
          {company.phone && company.address ? <Divider /> : null}
          {company.address ? <ListItem icon={MapPin} title="Endereço da oficina" subtitle={company.address} /> : null}
        </Group>
      )}

      <Group>
        <ListItem icon={ShieldCheck} title="Política de Privacidade" onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)} />
        <Divider />
        <ListItem icon={LogOut} title="Sair" danger chevron={false} onPress={() => setConfirmLogout(true)} />
      </Group>

      <Row style={{ justifyContent: 'center', marginTop: 8 }}>
        <Logo size={22} />
        <Muted>versão {APP_VERSION}</Muted>
      </Row>

      <Sheet visible={confirmLogout} onClose={() => setConfirmLogout(false)} title="Sair da conta?" description="Você precisará entrar de novo com e-mail e senha.">
        <SheetBody>
          <Button
            label="Sair"
            variant="danger"
            loading={leaving}
            onPress={() => {
              setLeaving(true);
              void logout();
            }}
          />
          <Button label="Continuar no app" variant="ghost" onPress={() => setConfirmLogout(false)} />
        </SheetBody>
      </Sheet>
    </Screen>
  );
}
