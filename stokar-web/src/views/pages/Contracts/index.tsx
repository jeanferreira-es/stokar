import { Handshake, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useServiceOptions } from '@/controllers/shared';
import { useContractsController } from '@/controllers/useWorkshopController';
import { CONTRACT_STATUS_LABEL, CONTRACT_STATUS_TONE, CONTRACT_STATUSES } from '@/models/labels';
import type { Contract, ContractInput, ContractStatus } from '@/models/types';
import { emptyToNull, formatCurrency, formatDate, toNumber } from '@/utils/format';
import { CustomerPicker, type PickedCustomer } from '../../components/CustomerPicker';
import * as F from '../../components/RequestFormDialog.styles';
import {
  Badge,
  Button,
  CellTitle,
  DataTable,
  Dialog,
  DialogFooter,
  EmptyState,
  ErrorText,
  Field,
  FormGrid,
  FormStack,
  HeaderActions,
  Input,
  PageHeader,
  RowActions,
  SearchInput,
  Select,
  Textarea,
  Toolbar,
  type Column,
} from '../../components/ui';

export function ContractsPage() {
  const c = useContractsController();

  const columns: Array<Column<Contract>> = [
    {
      key: 'title',
      header: 'Contrato',
      primary: true,
      cell: (x) => (
        <CellTitle>
          <strong>{x.title}</strong>
          <span>{x.code}</span>
        </CellTitle>
      ),
    },
    { key: 'customer', header: 'Cliente', cell: (x) => x.customer?.tradeName || x.customer?.name || '—' },
    {
      key: 'period',
      header: 'Vigência',
      cell: (x) => `${formatDate(x.startDate)} — ${x.endDate ? formatDate(x.endDate) : 'indeterminada'}`,
    },
    {
      key: 'monthly',
      header: 'Mensalidade',
      align: 'right',
      numeric: true,
      cell: (x) => (x.monthlyValue ? formatCurrency(x.monthlyValue) : '—'),
    },
    { key: 'discount', header: 'Desconto', align: 'right', numeric: true, cell: (x) => (x.discountPercent ? `${x.discountPercent}%` : '—') },
    {
      key: 'status',
      header: 'Situação',
      cell: (x) =>
        x.status === 'ACTIVE' && !x.usable ? (
          <Badge $tone="warning">Fora da vigência</Badge>
        ) : (
          <Badge $tone={CONTRACT_STATUS_TONE[x.status]}>{CONTRACT_STATUS_LABEL[x.status]}</Badge>
        ),
    },
  ];
  if (c.canManage) {
    columns.push({
      key: 'actions',
      header: 'Ações',
      align: 'right',
      actions: true,
      cell: (x) => (
        <RowActions>
          <Button variant="ghost" size="icon" aria-label={`Editar ${x.title}`} onClick={() => c.setEditing(x)}>
            <Pencil />
          </Button>
        </RowActions>
      ),
    });
  }

  return (
    <>
      <PageHeader>
        <div>
          <h1>Contratos</h1>
          <p>Acordos com empresas: vigência, mensalidade e os valores negociados para cada serviço.</p>
        </div>
        {c.canManage && (
          <HeaderActions>
            <Button onClick={() => c.setEditing('new')}>
              <Plus /> Novo contrato
            </Button>
          </HeaderActions>
        )}
      </PageHeader>

      <Toolbar>
        <SearchInput placeholder="Buscar por título ou cliente" value={c.search} onChange={(e) => c.setSearch(e.target.value)} />
        <Select aria-label="Situação" value={c.status} onChange={(e) => c.setStatus(e.target.value as ContractStatus | '')}>
          <option value="">Todas as situações</option>
          {CONTRACT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CONTRACT_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </Toolbar>

      <DataTable
        columns={columns}
        rows={c.rows}
        rowKey={(x) => x.id}
        loading={c.loading}
        meta={c.meta}
        onPageChange={c.setPage}
        onRowClick={c.canManage ? c.setEditing : undefined}
        empty={
          <EmptyState
            icon={<Handshake />}
            title={c.term || c.status ? 'Nenhum contrato encontrado' : 'Nenhum contrato cadastrado'}
            description={
              c.term || c.status
                ? 'Tente outro título, cliente ou situação.'
                : 'Crie um contrato para aplicar valores negociados aos serviços de uma empresa.'
            }
          />
        }
      />

      {c.editing && c.formReady && (
        <ContractFormDialog
          contract={c.editingContract ?? undefined}
          saving={c.saving}
          onSave={c.save}
          onClose={() => c.setEditing(null)}
        />
      )}
    </>
  );
}

interface FormValues {
  title: string;
  description: string;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  monthlyValue?: number;
  discountPercent?: number;
}

interface PriceDraft {
  serviceId: string;
  name: string;
  basePrice: number;
  price: string;
}

function ContractFormDialog(props: {
  contract?: Contract;
  saving: boolean;
  onSave: (input: ContractInput) => void;
  onClose: () => void;
}) {
  const ct = props.contract;
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: ct?.title ?? '',
      description: ct?.description ?? '',
      status: ct?.status ?? 'ACTIVE',
      startDate: ct?.startDate ?? new Date().toLocaleDateString('en-CA'),
      endDate: ct?.endDate ?? '',
      monthlyValue: ct?.monthlyValue ?? undefined,
      discountPercent: ct?.discountPercent ?? 0,
    },
  });
  const [customer, setCustomer] = useState<PickedCustomer | null>(
    ct?.customer ? { ...ct.customer, tradeName: ct.customer.tradeName ?? null, document: ct.customer.document ?? null } : null,
  );
  const [prices, setPrices] = useState<PriceDraft[]>(
    () =>
      ct?.services?.map((s) => ({
        serviceId: s.serviceId,
        name: s.service?.name ?? 'Serviço',
        basePrice: s.service?.price ?? 0,
        price: String(s.price),
      })) ?? [],
  );
  const [error, setError] = useState('');
  const catalog = useServiceOptions();
  const available = catalog.data?.filter((s) => !prices.some((p) => p.serviceId === s.id)) ?? [];
  const discount = watch('discountPercent') ?? 0;

  const submit = handleSubmit((v) => {
    if (!customer) return setError('Escolha o cliente do contrato');
    if (prices.some((p) => toNumber(p.price) === undefined || Number(p.price) < 0)) {
      return setError('Informe o valor negociado de cada serviço da tabela');
    }
    props.onSave({
      customerId: customer.id,
      title: v.title.trim(),
      description: emptyToNull(v.description),
      status: v.status,
      startDate: v.startDate,
      endDate: v.endDate || null,
      monthlyValue: v.monthlyValue ?? null,
      discountPercent: v.discountPercent ?? 0,
      services: prices.map((p) => ({ serviceId: p.serviceId, price: Number(p.price) })),
    });
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && props.onClose()}
      title={ct ? `Editar ${ct.code}` : 'Novo contrato'}
      description="Os serviços da tabela usam o valor negociado. Os demais usam o valor do catálogo com o desconto do contrato."
      size="lg"
    >
      <FormStack onSubmit={submit} noValidate>
        <Field label="Cliente" hint={ct ? 'O cliente do contrato não pode ser trocado' : undefined}>
          <CustomerPicker
            value={customer}
            disabled={!!ct}
            onChange={(next) => {
              setError('');
              setCustomer(next);
            }}
          />
        </Field>
        <Field label="Título" error={errors.title?.message}>
          <Input
            maxLength={160}
            placeholder="Ex.: Manutenção da frota 2026"
            {...register('title', { validate: (v) => v.trim().length >= 3 || 'Dê um título com ao menos 3 caracteres' })}
          />
        </Field>
        <FormGrid $columns={3}>
          <Field label="Início" error={errors.startDate?.message}>
            <Input type="date" {...register('startDate', { required: 'Informe o início' })} />
          </Field>
          <Field label="Fim" hint="Em branco = indeterminado" error={errors.endDate?.message}>
            <Input
              type="date"
              {...register('endDate', { validate: (v, all) => !v || v >= all.startDate || 'Deve ser depois do início' })}
            />
          </Field>
          <Field label="Situação">
            <Select {...register('status')}>
              {CONTRACT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {CONTRACT_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>
        <FormGrid>
          <Field label="Mensalidade (R$)" hint="Opcional, apenas informativo">
            <Input type="number" inputMode="decimal" step="0.01" min={0} {...register('monthlyValue', { setValueAs: toNumber })} />
          </Field>
          <Field label="Desconto nos demais serviços (%)" error={errors.discountPercent?.message}>
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              max={100}
              {...register('discountPercent', {
                setValueAs: toNumber,
                min: { value: 0, message: 'Entre 0 e 100' },
                max: { value: 100, message: 'Entre 0 e 100' },
              })}
            />
          </Field>
        </FormGrid>
        <Field label="Descrição e condições">
          <Textarea maxLength={10000} {...register('description')} />
        </Field>

        <F.Items>
          <legend>Tabela de preços negociados</legend>
          {prices.map((p) => (
            <F.ItemRow key={p.serviceId}>
              <div>
                <strong>{p.name}</strong>
                <small>Catálogo: {formatCurrency(p.basePrice)}</small>
              </div>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                aria-label={`Valor negociado de ${p.name}`}
                value={p.price}
                onChange={(e) => {
                  setError('');
                  setPrices((list) => list.map((x) => (x.serviceId === p.serviceId ? { ...x, price: e.target.value } : x)));
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remover ${p.name}`}
                onClick={() => setPrices((list) => list.filter((x) => x.serviceId !== p.serviceId))}
              >
                <Trash2 />
              </Button>
            </F.ItemRow>
          ))}
          <Select
            aria-label="Adicionar serviço à tabela"
            value=""
            onChange={(e) => {
              const service = catalog.data?.find((s) => s.id === e.target.value);
              if (!service) return;
              const suggested = Math.round(service.price * (1 - discount / 100) * 100) / 100;
              setPrices((list) => [
                ...list,
                { serviceId: service.id, name: service.name, basePrice: service.price, price: String(suggested) },
              ]);
            }}
          >
            <option value="">
              {catalog.data?.length === 0 ? 'Nenhum serviço cadastrado no catálogo' : 'Adicionar serviço com valor negociado'}
            </option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {formatCurrency(s.price)}
              </option>
            ))}
          </Select>
        </F.Items>

        {error && <ErrorText role="alert">{error}</ErrorText>}

        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={props.saving}>
            Salvar contrato
          </Button>
        </DialogFooter>
      </FormStack>
    </Dialog>
  );
}
