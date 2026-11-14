import { ArrowLeft, Car, FileQuestion, MessageCircle, Pencil, Plus, RotateCcw, Smartphone, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCustomerDetailController } from '@/controllers/useWorkshopController';
import { chatService } from '@/models/services/api';
import {
  CONTRACT_STATUS_LABEL,
  CONTRACT_STATUS_TONE,
  CUSTOMER_TYPE_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
} from '@/models/labels';
import type { Vehicle, VehicleInput } from '@/models/types';
import { emptyToNull, formatCurrency, formatDate, formatDocument, formatRelative, toNumber, vehicleLabel } from '@/utils/format';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Dialog,
  DialogFooter,
  EmptyState,
  Field,
  FormGrid,
  FormStack,
  Input,
  PageHeader,
  Skeleton,
  Stack,
} from '../../components/ui';
import * as R from '../Requests/Requests.styles';
import { CustomerFormDialog } from './CustomerFormDialog';
import * as S from './Customers.styles';

export function CustomerDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const c = useCustomerDetailController(id);
  const customer = c.customer;

  if (c.notFound) {
    return (
      <Card>
        <EmptyState
          icon={<FileQuestion />}
          title="Cliente não encontrado"
          action={
            <Button variant="outline" asChild>
              <R.Back to="/clientes" style={{ margin: 0 }}>
                Voltar para os clientes
              </R.Back>
            </Button>
          }
        />
      </Card>
    );
  }
  if (c.loading || !customer) {
    return (
      <Stack>
        <Skeleton $w="40%" $h="40px" />
        <Skeleton $h="320px" />
      </Stack>
    );
  }

  const openChat = async (userId: string) => {
    const conversation = await chatService.start(userId);
    navigate(`/atendimento?conversa=${conversation.id}`);
  };

  return (
    <>
      <R.Back to="/clientes">
        <ArrowLeft aria-hidden /> Clientes
      </R.Back>

      <PageHeader>
        <div>
          <h1>{customer.tradeName || customer.name}</h1>
          <R.TitleRow>
            <Badge $tone={customer.type === 'COMPANY' ? 'info' : 'neutral'}>{CUSTOMER_TYPE_LABEL[customer.type]}</Badge>
            {!customer.active && <Badge>Inativo</Badge>}
          </R.TitleRow>
        </div>
        <Button variant="secondary" onClick={() => c.openDialog('edit')}>
          <Pencil /> Editar cadastro
        </Button>
      </PageHeader>

      <S.Layout>
        <Stack $gap={6}>
          <Card>
            <CardHeader>
              <CardTitle>Veículos e equipamentos</CardTitle>
              <Button variant="outline" size="sm" onClick={() => c.editVehicle(null)}>
                <Plus /> Adicionar
              </Button>
            </CardHeader>
            {customer.vehicles.length === 0 ? (
              <S.Note>Nenhum veículo cadastrado. O cliente também pode cadastrar pelo aplicativo.</S.Note>
            ) : (
              <S.List>
                {customer.vehicles.map((v) => (
                  <li key={v.id}>
                    <div>
                      <strong>{vehicleLabel(v)}</strong>
                      <small>{[v.color, v.notes].filter(Boolean).join(' · ') || 'Sem observações'}</small>
                    </div>
                    <S.RowEnd>
                      {!v.active && <Badge>Inativo</Badge>}
                      <Button variant="ghost" size="icon" aria-label={`Editar ${v.model}`} onClick={() => c.editVehicle(v)}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={v.active ? `Desativar ${v.model}` : `Reativar ${v.model}`}
                        onClick={() => c.toggleVehicle(v)}
                      >
                        {v.active ? <Trash2 /> : <RotateCcw />}
                      </Button>
                    </S.RowEnd>
                  </li>
                ))}
              </S.List>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimos serviços</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link
                  to="/solicitacoes?nova=1"
                  state={{ customer: { id: customer.id, name: customer.name, tradeName: customer.tradeName, document: customer.document } }}
                >
                  <Plus /> Registrar serviço
                </Link>
              </Button>
            </CardHeader>
            {c.requests.length === 0 ? (
              <S.Note>Nenhum serviço registrado para este cliente.</S.Note>
            ) : (
              <S.List>
                {c.requests.map((r) => (
                  <li key={r.id}>
                    <Link to={`/solicitacoes/${r.id}`} style={{ minWidth: 0 }}>
                      <strong>{r.title}</strong>
                      <small>
                        {r.code} · {formatRelative(r.createdAt)}
                        {r.vehicle ? ` · ${vehicleLabel(r.vehicle)}` : ''}
                      </small>
                    </Link>
                    <S.RowEnd>
                      {r.totals && r.totals.total > 0 && <strong>{formatCurrency(r.totals.total)}</strong>}
                      <Badge $tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </S.RowEnd>
                  </li>
                ))}
              </S.List>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contratos</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/contratos">Ver contratos</Link>
              </Button>
            </CardHeader>
            {customer.contracts.length === 0 ? (
              <S.Note>Cliente sem contrato. Os serviços usam os valores do catálogo.</S.Note>
            ) : (
              <S.List>
                {customer.contracts.map((ct) => (
                  <li key={ct.id}>
                    <div>
                      <strong>{ct.title}</strong>
                      <small>
                        {ct.code} · desde {formatDate(ct.startDate)}
                        {ct.endDate ? ` até ${formatDate(ct.endDate)}` : ''}
                      </small>
                    </div>
                    <Badge $tone={CONTRACT_STATUS_TONE[ct.status]}>{CONTRACT_STATUS_LABEL[ct.status]}</Badge>
                  </li>
                ))}
              </S.List>
            )}
          </Card>
        </Stack>

        <Stack $gap={6}>
          <Card>
            <CardHeader>
              <CardTitle>Cadastro</CardTitle>
            </CardHeader>
            <R.Facts>
              {customer.tradeName && (
                <>
                  <dt>Razão social</dt>
                  <dd>{customer.name}</dd>
                </>
              )}
              <dt>{customer.type === 'COMPANY' ? 'CNPJ' : 'CPF'}</dt>
              <dd>{formatDocument(customer.document) || '—'}</dd>
              <dt>Telefone</dt>
              <dd>{customer.phone ?? '—'}</dd>
              <dt>E-mail</dt>
              <dd>{customer.email ?? '—'}</dd>
              <dt>Endereço</dt>
              <dd>{customer.address ?? '—'}</dd>
            </R.Facts>
            {customer.notes && <S.Notes>{customer.notes}</S.Notes>}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acesso ao aplicativo</CardTitle>
              {c.canManage && (
                <Button variant="outline" size="sm" onClick={() => c.openDialog('access')}>
                  <Plus /> Criar acesso
                </Button>
              )}
            </CardHeader>
            {customer.users.length === 0 ? (
              <S.Note>
                Ninguém deste cliente usa o aplicativo ainda.
                {c.canManage ? ' Crie um acesso para ele pedir serviços, acompanhar e conversar com a oficina.' : ''}
              </S.Note>
            ) : (
              <S.List>
                {customer.users.map((u) => (
                  <li key={u.id}>
                    <div>
                      <strong>{u.name}</strong>
                      <small>{u.email}</small>
                    </div>
                    <S.RowEnd>
                      {!u.active && <Badge>Inativo</Badge>}
                      {u.active && (
                        <Button variant="ghost" size="icon" aria-label={`Conversar com ${u.name}`} onClick={() => void openChat(u.id)}>
                          <MessageCircle />
                        </Button>
                      )}
                    </S.RowEnd>
                  </li>
                ))}
              </S.List>
            )}
          </Card>
        </Stack>
      </S.Layout>

      {c.dialog === 'edit' && (
        <CustomerFormDialog customer={customer} saving={c.busy} onSave={c.update} onClose={c.closeDialog} />
      )}
      {c.dialog === 'vehicle' && (
        <VehicleFormDialog vehicle={c.vehicle ?? undefined} saving={c.busy} onSave={c.saveVehicle} onClose={c.closeDialog} />
      )}
      {c.dialog === 'access' && <AccessFormDialog saving={c.busy} onSave={c.createAccess} onClose={c.closeDialog} />}
    </>
  );
}

interface VehicleValues {
  plate: string;
  brand: string;
  model: string;
  year?: number;
  color: string;
  notes: string;
}

function VehicleFormDialog(props: {
  vehicle?: Vehicle;
  saving: boolean;
  onSave: (input: VehicleInput) => void;
  onClose: () => void;
}) {
  const v = props.vehicle;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleValues>({
    defaultValues: {
      plate: v?.plate ?? '',
      brand: v?.brand ?? '',
      model: v?.model ?? '',
      year: v?.year ?? undefined,
      color: v?.color ?? '',
      notes: v?.notes ?? '',
    },
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && props.onClose()}
      title={v ? 'Editar veículo' : 'Novo veículo ou equipamento'}
      description="Para equipamentos sem placa, use o número de série no campo da placa ou deixe em branco."
    >
      <FormStack
        noValidate
        onSubmit={handleSubmit((x) =>
          props.onSave({
            plate: emptyToNull(x.plate),
            brand: emptyToNull(x.brand),
            model: x.model.trim(),
            year: x.year ?? null,
            color: emptyToNull(x.color),
            notes: emptyToNull(x.notes),
          }),
        )}
      >
        <FormGrid>
          <Field label="Placa ou nº de série">
            <Input maxLength={20} style={{ textTransform: 'uppercase' }} {...register('plate')} />
          </Field>
          <Field label="Ano" error={errors.year?.message}>
            <Input
              type="number"
              inputMode="numeric"
              {...register('year', {
                setValueAs: toNumber,
                min: { value: 1900, message: 'Ano inválido' },
                max: { value: 2100, message: 'Ano inválido' },
              })}
            />
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Marca">
            <Input maxLength={60} placeholder="Ex.: Honda" {...register('brand')} />
          </Field>
          <Field label="Modelo" error={errors.model?.message}>
            <Input
              maxLength={100}
              placeholder="Ex.: CG 160"
              {...register('model', { validate: (x) => x.trim().length >= 1 || 'Informe o modelo' })}
            />
          </Field>
        </FormGrid>
        <Field label="Cor">
          <Input maxLength={40} {...register('color')} />
        </Field>
        <Field label="Observações">
          <Input maxLength={2000} {...register('notes')} />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={props.saving}>
            <Car /> Salvar veículo
          </Button>
        </DialogFooter>
      </FormStack>
    </Dialog>
  );
}

function AccessFormDialog(props: {
  saving: boolean;
  onSave: (input: { name: string; email: string; password: string }) => void;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string; email: string; password: string }>();

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && props.onClose()}
      title="Criar acesso ao aplicativo"
      description="A pessoa entra no aplicativo com este e-mail e a senha inicial, e pode trocar a senha depois."
    >
      <FormStack
        noValidate
        onSubmit={handleSubmit((v) => props.onSave({ name: v.name.trim(), email: v.email.trim(), password: v.password }))}
      >
        <Field label="Nome" error={errors.name?.message}>
          <Input maxLength={120} {...register('name', { validate: (v) => v.trim().length >= 2 || 'Informe o nome' })} />
        </Field>
        <Field label="E-mail" error={errors.email?.message}>
          <Input
            type="email"
            maxLength={180}
            {...register('email', { validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'E-mail inválido' })}
          />
        </Field>
        <Field label="Senha inicial" hint="Ao menos 8 caracteres" error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            {...register('password', {
              minLength: { value: 8, message: 'A senha deve ter ao menos 8 caracteres' },
              required: 'Crie uma senha inicial',
            })}
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={props.saving}>
            <Smartphone /> Criar acesso
          </Button>
        </DialogFooter>
      </FormStack>
    </Dialog>
  );
}
