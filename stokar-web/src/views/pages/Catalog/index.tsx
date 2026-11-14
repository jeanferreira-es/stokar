import { Pencil, Plus, RotateCcw, Tags, Trash2, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useServiceTypeOptions } from '@/controllers/shared';
import { useServicesController, useServiceTypesController } from '@/controllers/useWorkshopController';
import type { ServiceTypeInput } from '@/models/services/api';
import type { Service, ServiceInput, ServiceType } from '@/models/types';
import { emptyToNull, formatCurrency, toNumber } from '@/utils/format';
import {
  Badge,
  Button,
  CellTitle,
  ConfirmDialog,
  DataTable,
  Dialog,
  DialogFooter,
  EmptyState,
  Field,
  FormGrid,
  FormStack,
  HeaderActions,
  Input,
  Muted,
  PageHeader,
  RowActions,
  SearchInput,
  Segmented,
  Select,
  Switch,
  Textarea,
  Toolbar,
  type Column,
} from '../../components/ui';

type Tab = 'services' | 'types';

/** Catálogo da oficina: serviços com valores e os tipos que os agrupam. */
export function CatalogPage() {
  const [tab, setTab] = useState<Tab>('services');
  return tab === 'services' ? <ServicesTab tab={tab} setTab={setTab} /> : <TypesTab tab={tab} setTab={setTab} />;
}

interface TabProps {
  tab: Tab;
  setTab: (tab: Tab) => void;
}

const Tabs = ({ tab, setTab }: TabProps) => (
  <Segmented<Tab>
    label="Catálogo"
    value={tab}
    onChange={setTab}
    options={[
      { value: 'services', label: 'Serviços e valores' },
      { value: 'types', label: 'Tipos de serviço' },
    ]}
  />
);

const duration = (minutes: number | null) => {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return rest ? `${Math.floor(minutes / 60)} h ${rest} min` : `${minutes / 60} h`;
};

/* ---------- Serviços ---------- */
function ServicesTab(props: TabProps) {
  const c = useServicesController();
  const types = useServiceTypeOptions();

  const columns: Array<Column<Service>> = [
    {
      key: 'name',
      header: 'Serviço',
      primary: true,
      cell: (s) => (
        <CellTitle>
          <strong>{s.name}</strong>
          {s.description && <span>{s.description}</span>}
        </CellTitle>
      ),
    },
    { key: 'type', header: 'Tipo', cell: (s) => (s.serviceType ? <Badge $tone="info">{s.serviceType.name}</Badge> : '—') },
    { key: 'time', header: 'Duração', cell: (s) => duration(s.estimatedMinutes) },
    { key: 'price', header: 'Valor', align: 'right', numeric: true, cell: (s) => <strong>{formatCurrency(s.price)}</strong> },
    { key: 'status', header: 'Situação', cell: (s) => (s.active ? <Badge $tone="success">Ativo</Badge> : <Badge>Inativo</Badge>) },
  ];
  if (c.canManage) {
    columns.push({
      key: 'actions',
      header: 'Ações',
      align: 'right',
      actions: true,
      cell: (s) => (
        <RowActions>
          <Button variant="ghost" size="icon" aria-label={`Editar ${s.name}`} onClick={() => c.setEditing(s)}>
            <Pencil />
          </Button>
          {s.active ? (
            <Button variant="ghost" size="icon" aria-label={`Desativar ${s.name}`} onClick={() => c.setRemoving(s)}>
              <Trash2 />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" aria-label={`Reativar ${s.name}`} onClick={() => c.reactivate(s)}>
              <RotateCcw />
            </Button>
          )}
        </RowActions>
      ),
    });
  }

  return (
    <>
      <PageHeader>
        <div>
          <h1>Serviços</h1>
          <p>O que a oficina faz e quanto cobra. Os clientes escolhem estes serviços no aplicativo.</p>
        </div>
        {c.canManage && (
          <HeaderActions>
            <Button onClick={() => c.setEditing('new')}>
              <Plus /> Novo serviço
            </Button>
          </HeaderActions>
        )}
      </PageHeader>

      <Toolbar>
        <Tabs {...props} />
      </Toolbar>
      <Toolbar>
        <SearchInput placeholder="Buscar serviço" value={c.search} onChange={(e) => c.setSearch(e.target.value)} />
        <Select aria-label="Tipo de serviço" value={c.serviceTypeId} onChange={(e) => c.setServiceTypeId(e.target.value)}>
          <option value="">Todos os tipos</option>
          {types.data?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <Switch checked={c.showInactive} onCheckedChange={c.setShowInactive} />
          <Muted>Mostrar inativos</Muted>
        </label>
      </Toolbar>

      <DataTable
        columns={columns}
        rows={c.rows}
        rowKey={(s) => s.id}
        loading={c.loading}
        meta={c.meta}
        onPageChange={c.setPage}
        empty={
          <EmptyState
            icon={<Wrench />}
            title={c.term || c.serviceTypeId ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
            description={
              c.term || c.serviceTypeId
                ? 'Tente outro nome ou tipo.'
                : 'Cadastre os serviços da oficina, como "Trocar pneu" ou "Realizar pintura", com o valor de cada um.'
            }
          />
        }
      />

      {c.editing && (
        <ServiceFormDialog
          service={c.editing === 'new' ? undefined : c.editing}
          types={types.data ?? []}
          saving={c.saving}
          onSave={c.save}
          onClose={() => c.setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!c.removing}
        onOpenChange={(open) => !open && c.setRemoving(null)}
        title={`Desativar ${c.removing?.name ?? ''}?`}
        description="O serviço deixa de aparecer para novos pedidos. Serviços já lançados e notas emitidas não mudam."
        confirmLabel="Desativar"
        danger
        loading={c.removingBusy}
        onConfirm={c.confirmRemove}
      />
    </>
  );
}

interface ServiceValues {
  name: string;
  description: string;
  price?: number;
  estimatedMinutes?: number;
  serviceTypeId: string;
}

function ServiceFormDialog(props: {
  service?: Service;
  types: ServiceType[];
  saving: boolean;
  onSave: (input: ServiceInput) => void;
  onClose: () => void;
}) {
  const s = props.service;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceValues>({
    defaultValues: {
      name: s?.name ?? '',
      description: s?.description ?? '',
      price: s?.price ?? undefined,
      estimatedMinutes: s?.estimatedMinutes ?? undefined,
      serviceTypeId: s?.serviceTypeId ?? '',
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && props.onClose()} title={s ? 'Editar serviço' : 'Novo serviço'}>
      <FormStack
        noValidate
        onSubmit={handleSubmit((v) =>
          props.onSave({
            name: v.name.trim(),
            description: emptyToNull(v.description),
            price: v.price ?? 0,
            estimatedMinutes: v.estimatedMinutes ?? null,
            serviceTypeId: v.serviceTypeId || null,
          }),
        )}
      >
        <Field label="Nome" error={errors.name?.message}>
          <Input
            maxLength={160}
            placeholder="Ex.: Trocar pneu"
            {...register('name', { validate: (v) => v.trim().length >= 2 || 'Informe o nome do serviço' })}
          />
        </Field>
        <FormGrid>
          <Field label="Valor (R$)" error={errors.price?.message}>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              {...register('price', {
                setValueAs: toNumber,
                validate: (v) => (v !== undefined && v >= 0) || 'Informe o valor',
              })}
            />
          </Field>
          <Field label="Duração estimada (min)" hint="Opcional" error={errors.estimatedMinutes?.message}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              {...register('estimatedMinutes', { setValueAs: toNumber, min: { value: 1, message: 'Use ao menos 1 minuto' } })}
            />
          </Field>
        </FormGrid>
        <Field label="Tipo de serviço" hint={props.types.length === 0 ? 'Cadastre os tipos na aba "Tipos de serviço"' : undefined}>
          <Select {...register('serviceTypeId')}>
            <option value="">Sem tipo</option>
            {props.types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Descrição" hint="Aparece para o cliente no aplicativo">
          <Textarea maxLength={4000} {...register('description')} />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={props.saving}>
            Salvar serviço
          </Button>
        </DialogFooter>
      </FormStack>
    </Dialog>
  );
}

/* ---------- Tipos de serviço ---------- */
function TypesTab(props: TabProps) {
  const c = useServiceTypesController();

  const columns: Array<Column<ServiceType>> = [
    {
      key: 'name',
      header: 'Tipo',
      primary: true,
      cell: (t) => (
        <CellTitle>
          <strong>{t.name}</strong>
          {t.description && <span>{t.description}</span>}
        </CellTitle>
      ),
    },
    { key: 'status', header: 'Situação', cell: (t) => (t.active ? <Badge $tone="success">Ativo</Badge> : <Badge>Inativo</Badge>) },
  ];
  if (c.canManage) {
    columns.push({
      key: 'actions',
      header: 'Ações',
      align: 'right',
      actions: true,
      cell: (t) => (
        <RowActions>
          <Button variant="ghost" size="icon" aria-label={`Editar ${t.name}`} onClick={() => c.setEditing(t)}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Excluir ${t.name}`} onClick={() => c.setRemoving(t)}>
            <Trash2 />
          </Button>
        </RowActions>
      ),
    });
  }

  return (
    <>
      <PageHeader>
        <div>
          <h1>Tipos de serviço</h1>
          <p>Grupos que organizam o catálogo, como Pneus, Mecânica ou Funilaria e pintura.</p>
        </div>
        {c.canManage && (
          <HeaderActions>
            <Button onClick={() => c.setEditing('new')}>
              <Plus /> Novo tipo
            </Button>
          </HeaderActions>
        )}
      </PageHeader>

      <Toolbar>
        <Tabs {...props} />
      </Toolbar>
      <Toolbar>
        <SearchInput placeholder="Buscar tipo" value={c.search} onChange={(e) => c.setSearch(e.target.value)} />
      </Toolbar>

      <DataTable
        columns={columns}
        rows={c.rows}
        rowKey={(t) => t.id}
        loading={c.loading}
        meta={c.meta}
        onPageChange={c.setPage}
        empty={
          <EmptyState
            icon={<Tags />}
            title={c.term ? 'Nenhum tipo encontrado' : 'Nenhum tipo de serviço'}
            description={c.term ? 'Tente outro nome.' : 'Crie tipos para agrupar os serviços do catálogo.'}
          />
        }
      />

      {c.editing && (
        <TypeFormDialog
          type={c.editing === 'new' ? undefined : c.editing}
          saving={c.saving}
          onSave={c.save}
          onClose={() => c.setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!c.removing}
        onOpenChange={(open) => !open && c.setRemoving(null)}
        title={`Excluir ${c.removing?.name ?? ''}?`}
        description="Os serviços deste tipo continuam no catálogo, mas ficam sem tipo."
        confirmLabel="Excluir"
        danger
        loading={c.removingBusy}
        onConfirm={c.confirmRemove}
      />
    </>
  );
}

function TypeFormDialog(props: {
  type?: ServiceType;
  saving: boolean;
  onSave: (input: ServiceTypeInput) => void;
  onClose: () => void;
}) {
  const t = props.type;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string; description: string }>({
    defaultValues: { name: t?.name ?? '', description: t?.description ?? '' },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && props.onClose()} title={t ? 'Editar tipo de serviço' : 'Novo tipo de serviço'} size="sm">
      <FormStack
        noValidate
        onSubmit={handleSubmit((v) => props.onSave({ name: v.name.trim(), description: emptyToNull(v.description) }))}
      >
        <Field label="Nome" error={errors.name?.message}>
          <Input maxLength={100} placeholder="Ex.: Pneus" {...register('name', { validate: (v) => v.trim().length >= 2 || 'Informe o nome' })} />
        </Field>
        <Field label="Descrição">
          <Textarea maxLength={2000} {...register('description')} />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={props.saving}>
            Salvar tipo
          </Button>
        </DialogFooter>
      </FormStack>
    </Dialog>
  );
}
