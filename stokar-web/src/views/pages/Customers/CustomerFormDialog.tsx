import { useForm } from 'react-hook-form';
import { CUSTOMER_TYPE_LABEL } from '@/models/labels';
import type { Customer, CustomerInput, CustomerType } from '@/models/types';
import { emptyToNull, formatDocument } from '@/utils/format';
import { Button, Dialog, DialogFooter, Field, FormGrid, FormStack, Input, Select, Textarea } from '../../components/ui';

interface FormValues {
  type: CustomerType;
  name: string;
  tradeName: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export function CustomerFormDialog(props: {
  customer?: Customer;
  saving: boolean;
  onSave: (input: CustomerInput) => void;
  onClose: () => void;
}) {
  const c = props.customer;
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      type: c?.type ?? 'COMPANY',
      name: c?.name ?? '',
      tradeName: c?.tradeName ?? '',
      document: formatDocument(c?.document),
      email: c?.email ?? '',
      phone: c?.phone ?? '',
      address: c?.address ?? '',
      notes: c?.notes ?? '',
    },
  });
  const company = watch('type') === 'COMPANY';

  return (
    <Dialog open onOpenChange={(open) => !open && props.onClose()} title={c ? 'Editar cliente' : 'Novo cliente'} size="lg">
      <FormStack
        noValidate
        onSubmit={handleSubmit((v) =>
          props.onSave({
            type: v.type,
            name: v.name.trim(),
            tradeName: company ? emptyToNull(v.tradeName) : null,
            document: emptyToNull(v.document),
            email: emptyToNull(v.email),
            phone: emptyToNull(v.phone),
            address: emptyToNull(v.address),
            notes: emptyToNull(v.notes),
          }),
        )}
      >
        <FormGrid>
          <Field label="Tipo">
            <Select {...register('type')}>
              {(Object.keys(CUSTOMER_TYPE_LABEL) as CustomerType[]).map((t) => (
                <option key={t} value={t}>
                  {CUSTOMER_TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={company ? 'CNPJ' : 'CPF'} error={errors.document?.message}>
            <Input
              maxLength={20}
              inputMode="numeric"
              {...register('document', {
                validate: (v) => {
                  const digits = v.replace(/\D/g, '');
                  return digits.length === 0 || digits.length === 11 || digits.length === 14 || 'Informe 11 (CPF) ou 14 (CNPJ) dígitos';
                },
              })}
            />
          </Field>
        </FormGrid>
        <Field label={company ? 'Razão social' : 'Nome'} error={errors.name?.message}>
          <Input maxLength={160} {...register('name', { validate: (v) => v.trim().length >= 2 || 'Informe o nome' })} />
        </Field>
        {company && (
          <Field label="Nome fantasia">
            <Input maxLength={160} {...register('tradeName')} />
          </Field>
        )}
        <FormGrid>
          <Field label="E-mail" error={errors.email?.message}>
            <Input
              type="email"
              maxLength={180}
              {...register('email', {
                validate: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'E-mail inválido',
              })}
            />
          </Field>
          <Field label="Telefone">
            <Input type="tel" maxLength={30} {...register('phone')} />
          </Field>
        </FormGrid>
        <Field label="Endereço">
          <Input maxLength={255} {...register('address')} />
        </Field>
        <Field label="Anotações internas" hint="Só a equipe vê. Não aparecem para o cliente">
          <Textarea maxLength={4000} {...register('notes')} />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={props.saving}>
            Salvar cliente
          </Button>
        </DialogFooter>
      </FormStack>
    </Dialog>
  );
}
