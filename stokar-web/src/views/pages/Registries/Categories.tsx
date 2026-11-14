import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useCategoriesController } from '@/controllers/useRegistriesController';
import type { CategoryInput } from '@/models/services/api';
import type { Category } from '@/models/types';
import { emptyToNull, formatDate } from '@/utils/format';
import {
  Button,
  CellTitle,
  ConfirmDialog,
  DataTable,
  Dialog,
  DialogFooter,
  EmptyState,
  Field,
  FormStack,
  HeaderActions,
  Input,
  PageHeader,
  RowActions,
  SearchInput,
  Textarea,
  Toolbar,
  type Column,
} from '../../components/ui';

export function CategoriesPage() {
  const c = useCategoriesController();

  const columns: Array<Column<Category>> = [
    {
      key: 'name',
      header: 'Categoria',
      primary: true,
      cell: (cat) => (
        <CellTitle>
          <strong>{cat.name}</strong>
        </CellTitle>
      ),
    },
    { key: 'description', header: 'Descrição', cell: (cat) => cat.description ?? '—' },
    { key: 'created', header: 'Criada em', cell: (cat) => formatDate(cat.createdAt) },
  ];
  if (c.canManage) {
    columns.push({
      key: 'actions',
      header: 'Ações',
      align: 'right',
      actions: true,
      cell: (cat) => (
        <RowActions>
          <Button variant="ghost" size="icon" aria-label={`Editar ${cat.name}`} onClick={() => c.setEditing(cat)}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Excluir ${cat.name}`} onClick={() => c.setRemoving(cat)}>
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
          <h1>Categorias</h1>
          <p>Grupos para organizar e filtrar os produtos.</p>
        </div>
        {c.canManage && (
          <HeaderActions>
            <Button onClick={() => c.setEditing('new')}>
              <Plus /> Nova categoria
            </Button>
          </HeaderActions>
        )}
      </PageHeader>

      <Toolbar>
        <SearchInput placeholder="Buscar categoria" value={c.search} onChange={(e) => c.setSearch(e.target.value)} />
      </Toolbar>

      <DataTable
        columns={columns}
        rows={c.rows}
        rowKey={(cat) => cat.id}
        loading={c.loading}
        meta={c.meta}
        onPageChange={c.setPage}
        empty={
          <EmptyState
            icon={<Tags />}
            title={c.term ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
            description={c.term ? 'Tente outro nome.' : 'Crie categorias como Elétrica, Hidráulica ou EPIs para agrupar os produtos.'}
          />
        }
      />

      {c.editing && (
        <CategoryFormDialog
          category={c.editing === 'new' ? undefined : c.editing}
          saving={c.saving}
          onSave={c.save}
          onClose={() => c.setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!c.removing}
        onOpenChange={(open) => !open && c.setRemoving(null)}
        title={`Excluir ${c.removing?.name ?? ''}?`}
        description="Os produtos desta categoria continuam cadastrados, mas ficam sem categoria. Não dá para desfazer."
        confirmLabel="Excluir categoria"
        danger
        loading={c.removingBusy}
        onConfirm={c.confirmRemove}
      />
    </>
  );
}

function CategoryFormDialog(props: {
  category?: Category;
  saving: boolean;
  onSave: (input: CategoryInput) => void;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string; description: string }>({
    defaultValues: { name: props.category?.name ?? '', description: props.category?.description ?? '' },
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && props.onClose()}
      title={props.category ? 'Editar categoria' : 'Nova categoria'}
      size="sm"
    >
      <FormStack
        noValidate
        onSubmit={handleSubmit((v) => props.onSave({ name: v.name.trim(), description: emptyToNull(v.description) }))}
      >
        <Field label="Nome" error={errors.name?.message}>
          <Input maxLength={100} {...register('name', { validate: (v) => v.trim().length >= 2 || 'Informe o nome' })} />
        </Field>
        <Field label="Descrição">
          <Textarea maxLength={2000} {...register('description')} />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={props.saving}>
            Salvar categoria
          </Button>
        </DialogFooter>
      </FormStack>
    </Dialog>
  );
}
