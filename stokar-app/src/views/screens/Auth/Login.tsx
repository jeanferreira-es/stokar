import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { AuthScreenProps } from '@/navigation/types';
import { isEmail } from '@/utils/format';
import { Logo } from '../../components/Logo';
import { Button, Card, Heading, PasswordField, Screen, TextField } from '../../components/ui';
import * as S from './Auth.styles';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

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

  return (
    <Screen topInset>
      <S.Hero>
        <Logo size={56} />
        <S.Tagline>Peça serviços, acompanhe o andamento e fale com a oficina.</S.Tagline>
      </S.Hero>

      <Card>
        <Heading>Entrar</Heading>
        <TextField
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="username"
        />
        <PasswordField
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
