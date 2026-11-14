import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSettingsController } from '@/controllers/useSettingsController';
import { ROLE_LABEL } from '@/models/labels';
import type { CompanySettings } from '@/models/types';
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
  PageHeader,
  Segmented,
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
        <CompanyCard company={c.company} saving={c.savingCompany} onSave={c.saveCompany} />
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
        </Stack>
      </S.Grid>
    </>
  );
}

type CompanyValues = Record<keyof CompanySettings, string>;

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
