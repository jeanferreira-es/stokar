import { Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth, useCurrentUser } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { isClient } from '@/models/permissions';
import { customersService } from '@/models/services/api';
import type { RootScreenProps } from '@/navigation/types';
import { emptyToNull, formatDocument } from '@/utils/format';
import { Button, Card, Field, Muted, Screen, Segmented, Sheet, SheetBody, Subheading, TextField } from '../../components/ui';

/** "Meus dados": dados de acesso e, para o cliente, o cadastro usado nas notas. */
export function ProfileScreen({ navigation }: RootScreenProps<'Profile'>) {
  const user = useCurrentUser();
  const { updateProfile, deleteAccount } = useAuth();
  const { profile, setProfile } = useAppData();
  const toast = useToast();
  const client = isClient(user);

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications);
  const [customerName, setCustomerName] = useState('');
  const [document, setDocument] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<{ name?: string; document?: string; customerName?: string }>({});
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setCustomerName(profile.name);
    setDocument(formatDocument(profile.document));
    setAddress(profile.address ?? '');
  }, [profile]);

  const company = profile?.type === 'COMPANY';

  const save = async () => {
    const digits = document.replace(/\D/g, '');
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Informe o seu nome';
    if (client && profile && customerName.trim().length < 2) next.customerName = 'Informe o nome';
    if (digits.length !== 0 && digits.length !== 11 && digits.length !== 14) next.document = 'Informe 11 (CPF) ou 14 (CNPJ) dígitos';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), phone: emptyToNull(phone), emailNotifications });
      if (client && profile) {
        setProfile(
          await customersService.updateMe({
            name: customerName.trim(),
            document: digits || null,
            address: emptyToNull(address),
            phone: emptyToNull(phone),
          }),
        );
      }
      toast.success('Dados salvos');
      navigation.goBack();
    } catch (error) {
      toast.error(error);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!password) return;
    setDeleteBusy(true);
    try {
      await deleteAccount(password);
    } catch (error) {
      toast.error(error);
      setDeleteBusy(false);
    }
  };

  return (
    <Screen footer={<Button label="Salvar" loading={saving} onPress={() => void save()} />}>
      <Card>
        <Subheading>Seu acesso</Subheading>
        <TextField label="Nome" value={name} onChangeText={setName} error={errors.name} autoComplete="name" />
        <TextField label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
        <TextField label="E-mail" value={user.email} editable={false} hint="Para trocar o e-mail, fale com a oficina" />
        <Field label="Avisos por e-mail" hint="Andamento dos serviços, notas e mensagens. Os avisos no aplicativo continuam.">
          <Segmented<'on' | 'off'>
            value={emailNotifications ? 'on' : 'off'}
            onChange={(v) => setEmailNotifications(v === 'on')}
            options={[
              { value: 'on', label: 'Receber' },
              { value: 'off', label: 'Não receber' },
            ]}
          />
        </Field>
      </Card>

      {client && profile && (
        <Card>
          <Subheading>{company ? 'Dados da empresa' : 'Dados para as notas'}</Subheading>
          <TextField
            label={company ? 'Razão social' : 'Nome completo'}
            value={customerName}
            onChangeText={setCustomerName}
            error={errors.customerName}
          />
          <TextField
            label={company ? 'CNPJ' : 'CPF'}
            value={document}
            onChangeText={setDocument}
            error={errors.document}
            keyboardType="number-pad"
          />
          <TextField label="Endereço" value={address} onChangeText={setAddress} />
        </Card>
      )}

      {(client || user.role === 'REQUESTER') && (
        <Card>
          <Subheading>Excluir conta</Subheading>
          <Muted>
            Seu acesso é encerrado e seu nome, e-mail e telefone são apagados da conta de acesso. O cadastro usado nas notas (nome, CPF ou
            CNPJ e endereço), os veículos, o histórico de serviços, as notas e as conversas continuam com a oficina pelos prazos da
            Política de Privacidade.
          </Muted>
          <Button label="Excluir minha conta" variant="danger" icon={Trash2} onPress={() => setDeleting(true)} />
        </Card>
      )}

      <Sheet
        visible={deleting}
        onClose={() => setDeleting(false)}
        title="Excluir a conta?"
        description="Esta ação não pode ser desfeita. Digite sua senha para confirmar."
      >
        <SheetBody>
          <TextField label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
          <Button label="Excluir definitivamente" variant="danger" loading={deleteBusy} disabled={!password} onPress={() => void confirmDelete()} />
          <Button label="Manter a conta" variant="ghost" onPress={() => setDeleting(false)} />
        </SheetBody>
      </Sheet>
    </Screen>
  );
}
