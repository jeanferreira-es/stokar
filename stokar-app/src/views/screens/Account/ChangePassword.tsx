import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { RootScreenProps } from '@/navigation/types';
import { Button, Card, Muted, PasswordField, Screen } from '../../components/ui';

export function ChangePasswordScreen({ navigation }: RootScreenProps<'ChangePassword'>) {
  const { changePassword } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const found = {
      current: current ? undefined : 'Informe a senha atual',
      next: next.length >= 8 ? undefined : 'A nova senha deve ter ao menos 8 caracteres',
      confirm: !confirm ? 'Repita a nova senha' : confirm !== next ? 'As senhas não são iguais' : undefined,
    };
    setErrors(found);
    if (found.current || found.next || found.confirm) return;

    setBusy(true);
    try {
      await changePassword(current, next);
      toast.success('Senha alterada');
      navigation.goBack();
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={<Button label="Trocar senha" loading={busy} onPress={() => void submit()} />}>
      <Card>
        <PasswordField label="Senha atual" value={current} onChangeText={setCurrent} error={errors.current} autoComplete="current-password" />
        <PasswordField label="Nova senha" hint="Ao menos 8 caracteres" value={next} onChangeText={setNext} error={errors.next} autoComplete="new-password" />
        <PasswordField
          label="Repita a nova senha"
          value={confirm}
          onChangeText={(value) => {
            setConfirm(value);
            if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined }));
          }}
          error={errors.confirm}
          autoComplete="new-password"
          onSubmitEditing={() => void submit()}
        />
        <Muted>Ao trocar a senha, os outros aparelhos conectados com esta conta são desconectados.</Muted>
      </Card>
    </Screen>
  );
}
