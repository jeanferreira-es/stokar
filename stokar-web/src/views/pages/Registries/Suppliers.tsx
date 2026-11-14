import { Pencil, Plus, RotateCcw, Trash2, Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useSuppliersController } from '@/controllers/useRegistriesController';
import type { SupplierInput } from '@/models/services/api';
import type { Supplier } from '@/models/types';
import { emptyToNull } from '@/utils/format';
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
  Switch,
  Toolbar,
  type Column,
} from '../../components/ui';

export function SuppliersPage() {
  const c = useSuppliersController();

  const columns: Array<Column<Supplier>> = [
    {
      key: 'name',
      header: 'Fornecedor',
      primary: true,
      cell: (s) => (
        <CellTitle>
          <strong>{s.name}</strong>
          {s.document && <span>{s.document}</span>}
        </CellTitle>
      ),
    },
    { key: 'email', header: 'E-mail', cell: (s) => s.email ?? '—' },
    { key: 'phone', header: 'Telefone', cell: (s) => s.phone ?? '—' },
    {
      key: 'status',
      header: 'Situação',
      cell: (s) => (s.active ? <Badge $tone="success">Ativo</Badge> : <Badge>Inativo</Badge>),
    },
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
          <h1>Fornecedores</h1>
          <p>Quem abastece o almoxarifado. Aparecem ao lançar uma entrada.</p>
        </div>
        {c.canManage && (
          <HeaderActions>
            <Button onClick={() => c.setEditing('new')}>
              <Plus /> Novo fornecedor
            </Button>
          </HeaderActions>
        )}
      </PageHeader>

      <Toolbar>
        <SearchInput placeholder="Buscar fornecedor" value={c.search} onChange={(e) => c.setSearch(e.target.value)} />
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
            icon={<Truck />}
            title={c.term ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
            description={c.term ? 'Tente outro nome.' : 'Cadastre fornecedores para identificar de onde veio cada entrada.'}
          />
        }
      />

      {c.editing && (
        <SupplierFormDialog
          supplier={c.editing === 'new' ? undefined : c.editing}
          saving={c.saving}
          onSave={c.save}
          onClose={() => c.setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!c.removing}
        onOpenChange={(open) => !open && c.setRemoving(null)}
        title={`Desativar ${c.removing?.name ?? ''}?`}
        description="O fornecedor deixa de aparecer em novas entradas. O histórico é mantido e você pode reativar depois."
        confirmLabel="Desativar"
        danger
        loading={c.removingBusy}
        onConfirm={c.confirmRemove}
      />
    </>
  );
}

interface SupplierFormValues {
  name: string;
  document: string;
  email: string;
  phone: string;
}

function SupplierFormDialog(props: {
  supplier?: Supplier;
  saving: boolean;
  onSave: (input: SupplierInput) => void;
  onClose: () => void;
}) {
  const s = props.supplier;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    defaultValues: { name: s?.name ?? '', document: s?.document ?? '', email: s?.email ?? '', phone: s?.phone ?? '' },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && props.onClose()} title={s ? 'Editar fornecedor' : 'Novo fornecedor'}>
      <FormStack
        noValidate
        onSubmit={handleSubmit((v) =>
          props.onSave({
            name: v.name.trim(),
            document: emptyToNull(v.document),
            email: emptyToNull(v.email),
            phone: emptyToNull(v.phone),
          }),
        )}
      >
        <Field label="Nome" error={errors.name?.message}>
          <Input maxLength={160} {...register('name', { validate: (v) => v.trim().length >= 2 || 'Informe o nome' })} />
        </Field>
        <FormGrid>
          <Field label="CNPJ ou CPF">
            <Input maxLength={20} {...register('document')} />
          </Field>
          <Field label="Telefone">
            <Input type="tel" maxLength={30} {...register('phone')} />
          </Field>
        </FormGrid>
        <Field label="E-mail" error={errors.email?.message}>
          <Input
            type="email"
            maxLength={180}
            {...register('email', {
              validate: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'E-mail inválido',
            })}
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={props.saving}>
            Salvar fornecedor
          </Button>
        </DialogFooter>
      </FormStack>
    </Dialog>
  );
}
