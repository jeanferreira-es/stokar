import { X } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, type TextInput } from 'react-native';
import { useTheme } from 'styled-components/native';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { recentAccounts, type RecentAccount } from '@/models/services/recentAccounts';
import type { AuthScreenProps } from '@/navigation/types';
import { isEmail } from '@/utils/format';
import { Logo } from '../../components/Logo';
import { Avatar, Button, Card, Fill, Heading, Muted, PasswordField, Screen, Stack, Strong, TextField } from '../../components/ui';
import * as S from './Auth.styles';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { login } = useAuth();
  const toast = useToast();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);
  const [accounts, setAccounts] = useState<RecentAccount[]>([]);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  // Contas que já entraram neste aparelho: atalho para preencher o e-mail (a senha continua sendo digitada)
  useEffect(() => {
    void recentAccounts.list().then((list) => {
      setAccounts(list);
      if (list.length === 1) setEmail(list[0].email);
    });
  }, []);

  const pick = (account: RecentAccount) => {
    setEmail(account.email);
    setPassword('');
    setErrors({});
    // Espera o campo atualizar antes de levar o foco para a senha
    setTimeout(() => passwordRef.current?.focus(), 50);
  };

  const forget = async (account: RecentAccount) => {
    setAccounts(await recentAccounts.forget(account.email));
    if (email === account.email) setEmail('');
  };

  const submit = async () => {
    const next = {
      email: isEmail(email) ? undefined : 'Informe um e-mail válido',
      password: password ? undefined : 'Informe a senha',
    };
    setErrors(next);
    if (next.email || next.password) return;

    setBusy(true);
    try {
      await login(email, password);
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(false);
    }
  };

  const selected = email.trim().toLowerCase();

  return (
    <Screen topInset>
      <S.Hero>
        <Logo size={56} />
        <S.Tagline>Peça serviços, acompanhe o andamento e fale com a oficina.</S.Tagline>
      </S.Hero>

      <Card>
        <Heading>Entrar</Heading>

        {accounts.length > 0 && (
          <Stack $gap={2}>
            <Muted>Entrar como</Muted>
            {accounts.map((account) => (
              <Pressable
                key={account.email}
                accessibilityRole="button"
                accessibilityLabel={`Entrar como ${account.name}, ${account.email}`}
                accessibilityState={{ selected: selected === account.email }}
                onPress={() => pick(account)}
              >
                {({ pressed }) => (
                  <S.AccountRow $selected={selected === account.email} $pressed={pressed}>
                    <Avatar name={account.name} size={36} />
                    <Fill>
                      <Strong numberOfLines={1}>{account.name}</Strong>
                      <Muted numberOfLines={1}>{account.email}</Muted>
                    </Fill>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remover ${account.email} deste aparelho`}
                      hitSlop={4}
                      onPress={() => void forget(account)}
                    >
                      <S.RemoveButton>
                        <X size={18} color={theme.colors.textSubtle} />
                      </S.RemoveButton>
                    </Pressable>
                  </S.AccountRow>
                )}
              </Pressable>
            ))}
          </Stack>
        )}

        <TextField
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <PasswordField
          ref={passwordRef}
          label="Senha"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={() => void submit()}
        />
        <Button label="Entrar" loading={busy} onPress={() => void submit()} />
      </Card>

      <Button label="Sou cliente e quero criar minha conta" variant="outline" onPress={() => navigation.navigate('Register')} />
      <S.Legal>Equipe da oficina: use o mesmo e-mail e senha do site.</S.Legal>
    </Screen>
  );
}
