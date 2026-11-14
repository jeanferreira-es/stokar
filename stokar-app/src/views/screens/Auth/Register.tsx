import * as Linking from 'expo-linking';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { CustomerType } from '@/models/types';
import { PRIVACY_POLICY_URL } from '@/utils/config';
import { isEmail } from '@/utils/format';
import { Button, Card, Field, PasswordField, Screen, Segmented, TextField } from '../../components/ui';
import * as S from './Auth.styles';

type Errors = Partial<Record<'name' | 'companyName' | 'document' | 'email' | 'password' | 'confirm', string>>;

/** Cadastro do cliente: cria o cadastro (pessoa ou empresa) e o acesso ao aplicativo. */
export function RegisterScreen() {
  const { registerClient } = useAuth();
  const toast = useToast();
  const [type, setType] = useState<CustomerType>('PERSON');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const company = type === 'COMPANY';

  const submit = async () => {
    const digits = document.replace(/\D/g, '');
    const next: Errors = {};
    if (name.trim().length < 2) next.name = 'Informe o seu nome';
    if (company && companyName.trim().length < 2) next.companyName = 'Informe o nome da empresa';
    if (digits.length !== 0 && digits.length !== 11 && digits.length !== 14) {
      next.document = 'Informe 11 (CPF) ou 14 (CNPJ) dígitos';
    }
    if (!isEmail(email)) next.email = 'Informe um e-mail válido';
    if (password.length < 8) next.password = 'A senha deve ter ao menos 8 caracteres';
    if (!confirm) next.confirm = 'Repita a senha';
    else if (confirm !== password) next.confirm = 'As senhas não são iguais';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      await registerClient({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        customerType: type,
        companyName: company ? companyName.trim() : undefined,
        document: digits || undefined,
      });
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Field label="A conta é para">
          <Segmented<CustomerType>
            value={type}
            onChange={setType}
            options={[
              { value: 'PERSON', label: 'Mim (pessoa física)' },
              { value: 'COMPANY', label: 'Minha empresa' },
            ]}
          />
        </Field>
        {company && (
          <TextField label="Nome da empresa" value={companyName} onChangeText={setCompanyName} error={errors.companyName} />
        )}
        <TextField label="Seu nome" value={name} onChangeText={setName} error={errors.name} autoComplete="name" />
        <TextField
          label={company ? 'CNPJ (opcional)' : 'CPF (opcional)'}
          hint="Usado para identificar você nas notas de serviço"
          value={document}
          onChangeText={setDocument}
          error={errors.document}
          keyboardType="number-pad"
        />
        <TextField label="Telefone (opcional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
        <TextField
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <PasswordField
          label="Senha"
          hint="Ao menos 8 caracteres"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <PasswordField
          label="Repita a senha"
          value={confirm}
          onChangeText={setConfirm}
          error={errors.confirm}
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={() => void submit()}
        />
        <Button label="Criar conta" loading={busy} onPress={() => void submit()} />
      </Card>

      <S.Legal>
        Ao criar a conta, você concorda com a{' '}
        <S.Link accessibilityRole="link" onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}>
          Política de Privacidade
        </S.Link>
        .
      </S.Legal>
    </Screen>
  );
}
