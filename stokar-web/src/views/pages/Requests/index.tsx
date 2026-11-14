import { ClipboardList, Plus } from 'lucide-react';
import { useServiceRequestsController } from '@/controllers/useServiceRequestsController';
import {
  PRIORITY_LABEL,
  PRIORITY_TONE,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  STATUS_LABEL,
  STATUS_TONE,
} from '@/models/labels';
import type { RequestPriority, ServiceRequest } from '@/models/types';
import { formatCurrency, formatDate, formatRelative, vehicleLabel } from '@/utils/format';
import { RequestFormDialog } from '../../components/RequestFormDialog';
import {
  Badge,
  Button,
  CellTitle,
  DataTable,
  EmptyState,
  HeaderActions,
  Muted,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  Switch,
  Toolbar,
  type Column,
} from '../../components/ui';
import * as S from './Requests.styles';

export function RequestsPage() {
  const c = useServiceRequestsController();

  const columns: Array<Column<ServiceRequest>> = [
    {
      key: 'title',
      header: 'Solicitação',
      primary: true,
      cell: (r) => (
        <CellTitle>
          <strong>{r.title}</strong>
          <span>
            {r.code}
            {r.vehicle ? ` · ${vehicleLabel(r.vehicle)}` : ''}
          </span>
        </CellTitle>
      ),
    },
    ...(c.staff
      ? [
          {
            key: 'customer',
            header: 'Cliente',
            cell: (r: ServiceRequest) => r.customer?.tradeName || r.customer?.name || <Muted>Interna</Muted>,
          },
        ]
      : []),
    { key: 'status', header: 'Status', cell: (r) => <Badge $tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge> },
    {
      key: 'priority',
      header: 'Prioridade',
      cell: (r) => <Badge $tone={PRIORITY_TONE[r.priority]}>{PRIORITY_LABEL[r.priority]}</Badge>,
    },
    { key: 'assignee', header: 'Responsável', cell: (r) => r.assignee?.name ?? '—' },
    ...(c.staff
      ? [
          {
            key: 'total',
            header: 'Total',
            align: 'right' as const,
            numeric: true,
            cell: (r: ServiceRequest) => (r.totals && r.totals.total > 0 ? formatCurrency(r.totals.total) : '—'),
          },
        ]
      : []),
    { key: 'due', header: 'Prazo', cell: (r) => (r.dueDate ? formatDate(r.dueDate) : '—') },
    { key: 'created', header: 'Aberta', cell: (r) => formatRelative(r.createdAt) },
  ];

  return (
    <>
      <PageHeader>
        <div>
          <h1>Solicitações de serviço</h1>
          <p>
            {c.staff
              ? 'Serviços dos clientes e pedidos internos, da abertura à conclusão e à nota.'
              : 'Seus pedidos de serviço e material, com o andamento de cada um.'}
          </p>
        </div>
        <HeaderActions>
          <Button onClick={c.openCreate}>
            <Plus /> {c.staff ? 'Registrar serviço' : 'Nova solicitação'}
          </Button>
        </HeaderActions>
      </PageHeader>

      <Toolbar>
        <Segmented
          label="Status"
          value={c.status}
          onChange={c.setStatus}
          options={[{ value: 'ALL', label: 'Todas' }, ...REQUEST_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))]}
        />
      </Toolbar>
      <Toolbar>
        <SearchInput placeholder={c.staff ? 'Buscar por título, cliente ou placa' : 'Buscar no título ou na descrição'} value={c.search} onChange={(e) => c.setSearch(e.target.value)} />
        <Select
          aria-label="Prioridade"
          value={c.priority}
          onChange={(e) => c.setPriority(e.target.value as RequestPriority | '')}
        >
          <option value="">Todas as prioridades</option>
          {REQUEST_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </Select>
        {c.staff && (
          <S.Check>
            <Switch checked={c.onlyMine} onCheckedChange={c.setOnlyMine} />
            <Muted>Atribuídas a mim</Muted>
          </S.Check>
        )}
      </Toolbar>

      <DataTable
        columns={columns}
        rows={c.rows}
        rowKey={(r) => r.id}
        loading={c.loading}
        meta={c.meta}
        onPageChange={c.setPage}
        onRowClick={c.open}
        empty={
          c.hasFilters ? (
            <EmptyState icon={<ClipboardList />} title="Nenhuma solicitação com esses filtros" description="Mude o status, a prioridade ou a busca." />
          ) : (
            <EmptyState
              icon={<ClipboardList />}
              title="Nenhuma solicitação ainda"
              description="Abra uma solicitação para pedir um serviço e reservar os materiais necessários."
              action={
                <Button onClick={c.openCreate}>
                  <Plus /> Nova solicitação
                </Button>
              }
            />
          )
        }
      />

      {c.creating && <RequestFormDialog staff={c.staff} initialCustomer={c.initialCustomer} busy={c.creatingBusy} onSubmit={c.create} onClose={c.closeCreate} />}
    </>
  );
}
