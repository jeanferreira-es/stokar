import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTour } from '@/controllers/TourController';
import { useSettingsController } from '@/controllers/useSettingsController';
import { ROLE_LABEL } from '@/models/labels';
import { PIX_KEY_TYPE_LABEL } from '@/models/labels';
import type { CompanySettings, PixKeyType } from '@/models/types';
import type { ThemeMode } from '@/styles/themes';
import { emptyToNull, formatDocument, initials } from '@/utils/format';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  DialogFooter,
  Field,
  FormGrid,
  FormStack,
  Input,
  Muted,
  PageHeader,
  Segmented,
  Select,
  Stack,
  Switch,
  Textarea,
} from '../../components/ui';
import * as S from './Settings.styles';

interface PasswordValues {
  currentPassword: string;
  newPassword: string;
  confirm: string;
}

export function SettingsPage() {
  const c = useSettingsController();
  const { startTour } = useTour();

  const profile = useForm<{ name: string }>({ defaultValues: { name: c.user.name } });
  const password = useForm<PasswordValues>();

  const submitPassword = password.handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await c.savePassword({ currentPassword, newPassword });
      password.reset();
    } catch {
      /* o controller já mostra o erro */
    }
  });

  return (
    <>
      <PageHeader>
        <div>
          <h1>Configurações</h1>
          <p>Sua conta, a aparência do app e como você quer ser avisado.</p>
        </div>
      </PageHeader>

      {c.canEditCompany && c.company && (
        <>
          <CompanyCard company={c.company} saving={c.savingCompany} onSave={c.saveCompany} />
          <PaymentCard company={c.company} saving={c.savingCompany} onSave={c.saveCompany} />
        </>
      )}

      <S.Grid>
        <Stack $gap={6}>
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <Badge $tone="primary">{ROLE_LABEL[c.user.role]}</Badge>
            </CardHeader>
            <S.Identity>
              <Avatar $size={56}>{initials(c.user.name)}</Avatar>
              <div>
                <strong>{c.user.name}</strong>
                <span>{c.user.email}</span>
              </div>
            </S.Identity>
            <S.InlineForm noValidate onSubmit={profile.handleSubmit((v) => c.saveName(v.name.trim()))}>
              <Field label="Nome" error={profile.formState.errors.name?.message}>
                <Input
                  maxLength={120}
                  autoComplete="name"
                  {...profile.register('name', { validate: (v) => v.trim().length >= 2 || 'Informe seu nome' })}
                />
              </Field>
              <Button type="submit" variant="secondary" loading={c.savingName}>
                Salvar nome
              </Button>
            </S.InlineForm>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Senha</CardTitle>
            </CardHeader>
            <FormStack noValidate onSubmit={submitPassword}>
              <Field label="Senha atual" error={password.formState.errors.currentPassword?.message}>
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...password.register('currentPassword', { required: 'Informe a senha atual' })}
                />
              </Field>
              <Field label="Nova senha" hint="Ao menos 8 caracteres" error={password.formState.errors.newPassword?.message}>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...password.register('newPassword', {
                    required: 'Crie a nova senha',
                    minLength: { value: 8, message: 'A senha deve ter ao menos 8 caracteres' },
                    maxLength: { value: 72, message: 'A senha pode ter até 72 caracteres' },
                  })}
                />
              </Field>
              <Field label="Repita a nova senha" error={password.formState.errors.confirm?.message}>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...password.register('confirm', {
                    validate: (v, all) => v === all.newPassword || 'As senhas não são iguais',
                  })}
                />
              </Field>
              <DialogFooter>
                <Button type="submit" loading={c.savingPassword}>
                  Alterar senha
                </Button>
              </DialogFooter>
            </FormStack>
          </Card>
        </Stack>

        <Stack $gap={6}>
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
            </CardHeader>
            <S.Option>
              <div>
                <strong>Tema</strong>
                <span>O escuro cansa menos a vista em galpões e turnos da noite.</span>
              </div>
              <Segmented<ThemeMode>
                label="Tema"
                value={c.theme.mode}
                onChange={c.theme.setMode}
                options={[
                  { value: 'light', label: 'Claro' },
                  { value: 'dark', label: 'Escuro' },
                ]}
              />
            </S.Option>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
            </CardHeader>
            <S.Option>
              <div>
                <strong>No app</strong>
                <span>Alertas de estoque e mudanças nas solicitações aparecem no sininho. Sempre ativo.</span>
              </div>
              <Switch checked disabled aria-label="Notificações no app" />
            </S.Option>
            <S.Option>
              <div>
                <strong>Por e-mail</strong>
                <span>Receba os mesmos avisos em {c.user.email}.</span>
              </div>
              <Switch
                checked={c.user.emailNotifications}
                disabled={c.togglingEmail}
                onCheckedChange={c.toggleEmail}
                aria-label="Notificações por e-mail"
              />
            </S.Option>
            <S.Option>
              <div>
                <strong>Do sistema</strong>
                <span>
                  {c.desktop.supported
                    ? 'Mostra um aviso do navegador quando o Stokar está aberto em outra aba.'
                    : 'Este navegador não oferece notificações do sistema.'}
                </span>
              </div>
              <Switch
                checked={c.desktop.enabled}
                disabled={!c.desktop.supported}
                onCheckedChange={(v) => void c.desktop.toggle(v)}
                aria-label="Notificações do sistema"
              />
            </S.Option>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tutorial</CardTitle>
            </CardHeader>
            <S.Option>
              <div>
                <strong>Conhecer o sistema</strong>
                <span>Um passo a passo rápido pelas principais áreas do Stokar.</span>
              </div>
              <Button variant="outline" onClick={startTour}>
                Ver tutorial
              </Button>
            </S.Option>
          </Card>
        </Stack>
      </S.Grid>
    </>
  );
}

type CompanyValues = Record<'name' | 'document' | 'email' | 'phone' | 'address' | 'invoiceFooter', string>;

/** Dados da oficina: cabeçalho das notas de serviço e contato exibido no aplicativo. */
function CompanyCard(props: {
  company: CompanySettings;
  saving: boolean;
  onSave: (input: Partial<CompanySettings>) => void;
}) {
  const toValues = (c: CompanySettings): CompanyValues => ({
    name: c.name,
    document: formatDocument(c.document),
    email: c.email ?? '',
    phone: c.phone ?? '',
    address: c.address ?? '',
    invoiceFooter: c.invoiceFooter ?? '',
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyValues>({ defaultValues: toValues(props.company) });

  const { company } = props;
  useEffect(() => reset(toValues(company)), [company, reset]);

  return (
    <Card style={{ marginBottom: 24 }}>
      <CardHeader>
        <CardTitle>Dados da oficina</CardTitle>
      </CardHeader>
      <FormStack
        noValidate
        onSubmit={handleSubmit((v) =>
          props.onSave({
            name: v.name.trim(),
            document: emptyToNull(v.document),
            email: emptyToNull(v.email),
            phone: emptyToNull(v.phone),
            address: emptyToNull(v.address),
            invoiceFooter: emptyToNull(v.invoiceFooter),
          }),
        )}
      >
        <FormGrid>
          <Field label="Nome da oficina" hint="Aparece no cabeçalho das notas" error={errors.name?.message}>
            <Input maxLength={160} {...register('name', { validate: (v) => v.trim().length >= 2 || 'Informe o nome' })} />
          </Field>
          <Field label="CNPJ ou CPF" error={errors.document?.message}>
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
        <FormGrid>
          <Field label="Telefone">
            <Input type="tel" maxLength={30} {...register('phone')} />
          </Field>
          <Field label="E-mail" error={errors.email?.message}>
            <Input
              type="email"
              maxLength={180}
              {...register('email', {
                validate: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'E-mail inválido',
              })}
            />
          </Field>
        </FormGrid>
        <Field label="Endereço">
          <Input maxLength={255} {...register('address')} />
        </Field>
        <Field label="Texto padrão no rodapé das notas" hint="Ex.: garantia e formas de pagamento">
          <Textarea maxLength={2000} {...register('invoiceFooter')} />
        </Field>
        <DialogFooter>
          <Button type="submit" loading={props.saving}>
            Salvar dados da oficina
          </Button>
        </DialogFooter>
      </FormStack>
    </Card>
  );
}

interface PaymentValues {
  pixKeyType: PixKeyType | '';
  pixKey: string;
  pixCity: string;
  paymentInstructions: string;
  requirePaymentToComplete: boolean;
}

const PIX_PLACEHOLDER: Record<PixKeyType, string> = {
  CPF: '000.000.000-00',
  CNPJ: '00.000.000/0000-00',
  EMAIL: 'financeiro@suaoficina.com.br',
  PHONE: '(92) 99999-0000',
  RANDOM: '123e4567-e89b-12d3-a456-426614174000',
};

/** Confere a chave conforme o tipo (a API faz a mesma validação). */
function validatePixKey(type: PixKeyType | '', key: string): true | string {
  const value = key.trim();
  if (!value) return true;
  if (!type) return 'Escolha o tipo da chave';
  const digits = value.replace(/\D/g, '');
  const ok: Record<PixKeyType, boolean> = {
    CPF: digits.length === 11,
    CNPJ: digits.length === 14,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    PHONE: digits.length >= 10 && digits.length <= 13,
    RANDOM: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
  };
  return ok[type] || `A chave não parece um ${PIX_KEY_TYPE_LABEL[type].toLowerCase()} válido`;
}

/** Como o cliente paga: chave PIX exibida no aplicativo e nas notas, e a regra de encerramento. */
function PaymentCard(props: {
  company: CompanySettings;
  saving: boolean;
  onSave: (input: Partial<CompanySettings>) => void;
}) {
  const toValues = (c: CompanySettings): PaymentValues => ({
    pixKeyType: c.pixKeyType ?? '',
    pixKey: c.pixKey ?? '',
    pixCity: c.pixCity ?? '',
    paymentInstructions: c.paymentInstructions ?? '',
    requirePaymentToComplete: c.requirePaymentToComplete,
  });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentValues>({ defaultValues: toValues(props.company) });

  const { company } = props;
  useEffect(() => reset(toValues(company)), [company, reset]);
  const type = watch('pixKeyType');
  const requirePayment = watch('requirePaymentToComplete');

  return (
    <Card style={{ marginBottom: 24 }}>
      <CardHeader>
        <CardTitle>Pagamento</CardTitle>
      </CardHeader>
      <FormStack
        noValidate
        onSubmit={handleSubmit((v) =>
          props.onSave({
            pixKeyType: v.pixKey.trim() ? v.pixKeyType || null : null,
            pixKey: emptyToNull(v.pixKey),
            pixCity: emptyToNull(v.pixCity),
            paymentInstructions: emptyToNull(v.paymentInstructions),
            requirePaymentToComplete: v.requirePaymentToComplete,
          }),
        )}
      >
        <Muted>
          O cliente vê os valores a pagar na tela inicial do aplicativo, com a chave PIX e o código &quot;PIX copia e cola&quot; de
          cada serviço. O pagamento cai direto na conta da oficina; depois, registre-o na solicitação.
        </Muted>
        <FormGrid>
          <Field label="Tipo da chave PIX" error={errors.pixKeyType?.message}>
            <Select {...register('pixKeyType')}>
              <option value="">Sem PIX</option>
              {(Object.keys(PIX_KEY_TYPE_LABEL) as PixKeyType[]).map((t) => (
                <option key={t} value={t}>
                  {PIX_KEY_TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Chave PIX" error={errors.pixKey?.message}>
            <Input
              maxLength={140}
              placeholder={type ? PIX_PLACEHOLDER[type] : 'Escolha o tipo da chave'}
              disabled={!type}
              {...register('pixKey', { validate: (v, form) => validatePixKey(form.pixKeyType, v) })}
            />
          </Field>
        </FormGrid>
        <Field
          label="Cidade da conta"
          hint="Exigida pelo PIX para gerar o código com o valor de cada serviço. Sem ela, o cliente vê só a chave."
        >
          <Input maxLength={60} placeholder="Ex.: Manaus" disabled={!type} {...register('pixCity')} />
        </Field>
        <Field label="Instruções de pagamento" hint="Ex.: aceitamos cartão no balcão; envie o comprovante pelo chat">
          <Textarea maxLength={2000} {...register('paymentInstructions')} />
        </Field>
        <S.Option>
          <div>
            <strong>Concluir só depois do pagamento</strong>
            <span>
              Desligado, o serviço pode ser concluído e pago depois. Ligado, o botão de concluir só aparece com o pagamento
              registrado.
            </span>
          </div>
          <Switch
            checked={requirePayment}
            onCheckedChange={(v) => setValue('requirePaymentToComplete', v, { shouldDirty: true })}
            aria-label="Concluir só depois do pagamento"
          />
        </S.Option>
        <DialogFooter>
          <Button type="submit" loading={props.saving}>
            Salvar pagamento
          </Button>
        </DialogFooter>
      </FormStack>
    </Card>
  );
}
