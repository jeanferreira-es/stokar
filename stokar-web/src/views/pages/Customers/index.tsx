import { Building2, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useCustomersController } from '@/controllers/useWorkshopController';
import { CUSTOMER_TYPE_LABEL } from '@/models/labels';
import type { Customer, CustomerType } from '@/models/types';
import { formatDocument } from '@/utils/format';
import {
  Badge,
  Button,
  CellTitle,
  ConfirmDialog,
  DataTable,
  EmptyState,
  HeaderActions,
  Muted,
  PageHeader,
  RowActions,
  SearchInput,
  Select,
  Switch,
  Toolbar,
  type Column,
} from '../../components/ui';
import { CustomerFormDialog } from './CustomerFormDialog';

export function CustomersPage() {
  const c = useCustomersController();

  const columns: Array<Column<Customer>> = [
    {
      key: 'name',
      header: 'Cliente',
      primary: true,
      cell: (x) => (
        <CellTitle>
          <strong>{x.tradeName || x.name}</strong>
          <span>{x.tradeName ? x.name : formatDocument(x.document)}</span>
        </CellTitle>
      ),
    },
    { key: 'type', header: 'Tipo', cell: (x) => <Badge $tone={x.type === 'COMPANY' ? 'info' : 'neutral'}>{CUSTOMER_TYPE_LABEL[x.type]}</Badge> },
    { key: 'document', header: 'CPF/CNPJ', cell: (x) => formatDocument(x.document) || '—' },
    { key: 'phone', header: 'Telefone', cell: (x) => x.phone ?? '—' },
    { key: 'email', header: 'E-mail', cell: (x) => x.email ?? '—' },
    {
      key: 'status',
      header: 'Situação',
      cell: (x) => (x.active ? <Badge $tone="success">Ativo</Badge> : <Badge>Inativo</Badge>),
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      actions: true,
      cell: (x) => (
        <RowActions>
          <Button variant="ghost" size="icon" aria-label={`Editar ${x.name}`} onClick={() => c.setEditing(x)}>
            <Pencil />
          </Button>
          {c.canRemove &&
            (x.active ? (
              <Button variant="ghost" size="icon" aria-label={`Desativar ${x.name}`} onClick={() => c.setRemoving(x)}>
                <Trash2 />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" aria-label={`Reativar ${x.name}`} onClick={() => c.reactivate(x)}>
                <RotateCcw />
              </Button>
            ))}
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader>
        <div>
          <h1>Clientes</h1>
          <p>Empresas e pessoas atendidas pela oficina, com veículos, contratos e acesso ao aplicativo.</p>
        </div>
        <HeaderActions>
          <Button onClick={() => c.setEditing('new')}>
            <Plus /> Novo cliente
          </Button>
        </HeaderActions>
      </PageHeader>

      <Toolbar>
        <SearchInput placeholder="Buscar por nome, CPF/CNPJ ou e-mail" value={c.search} onChange={(e) => c.setSearch(e.target.value)} />
        <Select aria-label="Tipo de cliente" value={c.type} onChange={(e) => c.setType(e.target.value as CustomerType | '')}>
          <option value="">Empresas e pessoas</option>
          <option value="COMPANY">Empresas</option>
          <option value="PERSON">Pessoas físicas</option>
        </Select>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <Switch checked={c.showInactive} onCheckedChange={c.setShowInactive} />
          <Muted>Mostrar inativos</Muted>
        </label>
      </Toolbar>

      <DataTable
        columns={columns}
        rows={c.rows}
        rowKey={(x) => x.id}
        loading={c.loading}
        meta={c.meta}
        onPageChange={c.setPage}
        onRowClick={c.open}
        empty={
          <EmptyState
            icon={<Building2 />}
            title={c.term || c.type ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            description={
              c.term || c.type
                ? 'Tente outro nome ou documento.'
                : 'Cadastre o primeiro cliente. Quem se cadastra pelo aplicativo também aparece aqui.'
            }
          />
        }
      />

      {c.editing && (
        <CustomerFormDialog
          customer={c.editing === 'new' ? undefined : c.editing}
          saving={c.saving}
          onSave={c.save}
          onClose={() => c.setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!c.removing}
        onOpenChange={(open) => !open && c.setRemoving(null)}
        title={`Desativar ${c.removing?.name ?? ''}?`}
        description="O cliente deixa de aparecer em novos serviços. O histórico e as notas são mantidos e você pode reativar depois."
        confirmLabel="Desativar"
        danger
        loading={c.removingBusy}
        onConfirm={c.confirmRemove}
      />
    </>
  );
}
