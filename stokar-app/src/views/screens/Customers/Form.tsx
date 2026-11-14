import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { customersService } from '@/models/services/api';
import type { CustomerType } from '@/models/types';
import type { RootScreenProps } from '@/navigation/types';
import { emptyToNull, isEmail } from '@/utils/format';
import { Button, Card, Field, Muted, Screen, Segmented, TextField } from '../../components/ui';

/** Equipe: cadastro rápido de cliente durante o registro de um serviço. */
export function CustomerFormScreen({ navigation }: RootScreenProps<'CustomerForm'>) {
  const toast = useToast();
  const [type, setType] = useState<CustomerType>('PERSON');
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; document?: string; email?: string }>({});
  const [busy, setBusy] = useState(false);
  const company = type === 'COMPANY';

  const save = async () => {
    const digits = document.replace(/\D/g, '');
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Informe o nome';
    if (digits.length !== 0 && digits.length !== 11 && digits.length !== 14) next.document = 'Informe 11 (CPF) ou 14 (CNPJ) dígitos';
    if (email.trim() && !isEmail(email)) next.email = 'E-mail inválido';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      const customer = await customersService.create({
        type,
        name: name.trim(),
        document: digits || null,
        phone: emptyToNull(phone),
        email: emptyToNull(email),
      });
      toast.success('Cliente cadastrado');
      // Volta para o registro do serviço com o cliente já escolhido
      navigation.popTo('NewRequest', {
        customer: { id: customer.id, name: customer.name, tradeName: customer.tradeName, document: customer.document },
      });
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={<Button label="Cadastrar cliente" loading={busy} onPress={() => void save()} />}>
      <Card>
        <Field label="Tipo">
          <Segmented<CustomerType>
            value={type}
            onChange={setType}
            options={[
              { value: 'PERSON', label: 'Pessoa física' },
              { value: 'COMPANY', label: 'Empresa' },
            ]}
          />
        </Field>
        <TextField label={company ? 'Razão social' : 'Nome'} value={name} onChangeText={setName} error={errors.name} />
        <TextField label={company ? 'CNPJ' : 'CPF'} hint="Opcional" value={document} onChangeText={setDocument} error={errors.document} keyboardType="number-pad" />
        <TextField label="Telefone" hint="Opcional" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextField label="E-mail" hint="Opcional" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none" />
        <Muted>Veículos, contratos e o acesso do cliente ao aplicativo são cadastrados depois, pelo site.</Muted>
      </Card>
    </Screen>
  );
}
