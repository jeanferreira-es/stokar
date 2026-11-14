import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Ellipsis,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useProductsController, type StockFilter } from '@/controllers/useProductsController';
import type { Category, Product, ProductInput } from '@/models/types';
import { emptyToNull, formatCurrency, formatQuantity, toNumber } from '@/utils/format';
import { MovementDialog } from '../../components/MovementDialog';
import {
  Badge,
  Button,
  CellTitle,
  ConfirmDialog,
  DataTable,
  Dialog,
  DialogFooter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  Field,
  FormGrid,
  FormStack,
  HeaderActions,
  Input,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  Textarea,
  Toolbar,
  type Column,
} from '../../components/ui';

const STOCK_OPTIONS: Array<{ value: StockFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'low', label: 'Estoque baixo' },
  { value: 'ok', label: 'Em dia' },
  { value: 'inactive', label: 'Inativos' },
];

export function ProductsPage() {
  const c = useProductsController();

  const columns: Array<Column<Product>> = [
    {
      key: 'name',
      header: 'Produto',
      primary: true,
      cell: (p) => (
        <CellTitle>
          <strong>{p.name}</strong>
          <span>{p.sku}</span>
        </CellTitle>
      ),
    },
    { key: 'category', header: 'Categoria', cell: (p) => p.category?.name ?? '—' },
    { key: 'location', header: 'Local', cell: (p) => p.location ?? '—' },
    {
      key: 'quantity',
      header: 'Saldo',
      align: 'right',
      numeric: true,
      cell: (p) => <strong>{formatQuantity(p.quantity, p.unit)}</strong>,
    },
    { key: 'min', header: 'Mínimo', align: 'right', numeric: true, cell: (p) => formatQuantity(p.minQuantity, p.unit) },
    { key: 'cost', header: 'Custo médio', align: 'right', numeric: true, cell: (p) => formatCurrency(p.costPrice) },
    {
      key: 'status',
      header: 'Situação',
      cell: (p) =>
        !p.active ? (
          <Badge>Inativo</Badge>
        ) : p.quantity === 0 ? (
          <Badge $tone="danger">Sem estoque</Badge>
        ) : p.lowStock ? (
          <Badge $tone="warning">
            <TriangleAlert aria-hidden /> Baixo
          </Badge>
        ) : (
          <Badge $tone="success">Em dia</Badge>
        ),
    },
  ];

  if (c.canMove) {
    columns.push({
      key: 'actions',
      header: 'Ações',
      align: 'right',
      actions: true,
      cell: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Ações de ${p.name}`}>
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {p.active && (
              <>
                <DropdownMenuItem onSelect={() => c.openMovement(p, 'IN')}>
                  <ArrowDownToLine /> Lançar entrada
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => c.openMovement(p, 'OUT')}>
                  <ArrowUpFromLine /> Lançar saída
                </DropdownMenuItem>
              </>
            )}
            {c.canManage && p.active && (
              <>
                <DropdownMenuItem onSelect={() => c.openMovement(p, 'ADJUSTMENT')}>
                  <SlidersHorizontal /> Ajustar saldo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => c.openEdit(p)}>
                  <Pencil /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem $danger onSelect={() => c.askDeactivate(p)}>
                  <Trash2 /> Desativar
                </DropdownMenuItem>
              </>
            )}
            {c.canManage && !p.active && (
              <DropdownMenuItem onSelect={() => c.reactivate(p)}>
                <RotateCcw /> Reativar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });
  }

  return (
    <>
      <PageHeader>
        <div>
          <h1>Produtos</h1>
          <p>Itens do almoxarifado, com saldo, mínimo e custo médio.</p>
        </div>
        {c.canManage && (
          <HeaderActions>
            <Button onClick={c.openCreate}>
              <Plus /> Novo produto
            </Button>
          </HeaderActions>
        )}
      </PageHeader>

      <Toolbar>
        <SearchInput placeholder="Buscar por nome ou SKU" value={c.search} onChange={(e) => c.setSearch(e.target.value)} />
        <Select aria-label="Categoria" value={c.categoryId} onChange={(e) => c.setCategoryId(e.target.value)}>
          <option value="">Todas as categorias</option>
          {c.categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
        <Segmented label="Situação do estoque" value={c.stock} onChange={c.setStock} options={STOCK_OPTIONS} />
      </Toolbar>

      <DataTable
        columns={columns}
        rows={c.rows}
        rowKey={(p) => p.id}
        loading={c.loading}
        meta={c.meta}
        onPageChange={c.setPage}
        empty={
          c.hasFilters ? (
            <EmptyState icon={<Package />} title="Nenhum produto com esses filtros" description="Tente outra busca ou limpe os filtros." />
          ) : (
            <EmptyState
              icon={<Package />}
              title="Nenhum produto cadastrado"
              description="Cadastre os itens do almoxarifado para começar a lançar entradas e saídas."
              action={
                c.canManage && (
                  <Button onClick={c.openCreate}>
                    <Plus /> Novo produto
                  </Button>
                )
              }
            />
          )
        }
      />

      {c.editing && (
        <ProductFormDialog
          product={c.editing === 'new' ? undefined : c.editing}
          categories={c.categories}
          saving={c.saving}
          onSave={c.save}
          onClose={c.closeForm}
        />
      )}

      {c.moving && <MovementDialog type={c.moving.type} product={c.moving.product} onClose={c.closeMovement} />}

      <ConfirmDialog
        open={!!c.deactivating}
        onOpenChange={(open) => !open && c.askDeactivate(null)}
        title={`Desativar ${c.deactivating?.name ?? ''}?`}
        description="O produto sai das listas e não aceita novas movimentações. O histórico é mantido e você pode reativar depois."
        confirmLabel="Desativar"
        danger
        loading={c.deactivatingBusy}
        onConfirm={c.confirmDeactivate}
      />
    </>
  );
}

interface ProductFormValues {
  sku: string;
  name: string;
  description: string;
  unit: string;
  minQuantity?: number;
  costPrice?: number;
  salePrice?: number;
  location: string;
  categoryId: string;
}

function ProductFormDialog(props: {
  product?: Product;
  categories: Category[];
  saving: boolean;
  onSave: (input: ProductInput) => void;
  onClose: () => void;
}) {
  const { product } = props;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      sku: product?.sku ?? '',
      name: product?.name ?? '',
      description: product?.description ?? '',
      unit: product?.unit ?? 'UN',
      minQuantity: product?.minQuantity ?? 0,
      costPrice: product?.costPrice ?? 0,
      salePrice: product?.salePrice ?? 0,
      location: product?.location ?? '',
      categoryId: product?.categoryId ?? '',
    },
  });

  const onSubmit = handleSubmit((v) =>
    props.onSave({
      sku: v.sku.trim(),
      name: v.name.trim(),
      description: emptyToNull(v.description),
      unit: v.unit.trim().toUpperCase() || 'UN',
      minQuantity: v.minQuantity ?? 0,
      costPrice: v.costPrice ?? 0,
      salePrice: v.salePrice ?? 0,
      location: emptyToNull(v.location),
      categoryId: v.categoryId || null,
    }),
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && props.onClose()}
      title={product ? 'Editar produto' : 'Novo produto'}
      description="O saldo não é editado aqui: ele muda pelas entradas, saídas e ajustes."
    >
      <FormStack onSubmit={onSubmit} noValidate>
        <FormGrid>
          <Field label="SKU" error={errors.sku?.message}>
            <Input maxLength={60} {...register('sku', { validate: (v) => v.trim().length > 0 || 'Informe o SKU' })} />
          </Field>
          <Field label="Unidade" hint="UN, CX, KG, L, M…" error={errors.unit?.message}>
            <Input maxLength={10} {...register('unit', { validate: (v) => v.trim().length > 0 || 'Informe a unidade' })} />
          </Field>
        </FormGrid>
        <Field label="Nome" error={errors.name?.message}>
          <Input
            maxLength={160}
            {...register('name', { validate: (v) => v.trim().length >= 2 || 'Informe o nome do produto' })}
          />
        </Field>
        <FormGrid>
          <Field label="Categoria">
            <Select {...register('categoryId')}>
              <option value="">Sem categoria</option>
              {props.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Local no almoxarifado" hint="Ex.: Corredor B / Prateleira 3">
            <Input maxLength={80} {...register('location')} />
          </Field>
          <Field label="Estoque mínimo" hint="Ao chegar aqui, a equipe é avisada" error={errors.minQuantity?.message}>
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              {...register('minQuantity', { setValueAs: toNumber, min: { value: 0, message: 'Não pode ser negativo' } })}
            />
          </Field>
          <Field label="Custo médio (R$)" error={errors.costPrice?.message}>
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              {...register('costPrice', { setValueAs: toNumber, min: { value: 0, message: 'Não pode ser negativo' } })}
            />
          </Field>
          <Field label="Preço de venda (R$)" hint="Valor sugerido quando a peça entra em um serviço" error={errors.salePrice?.message}>
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              {...register('salePrice', { setValueAs: toNumber, min: { value: 0, message: 'Não pode ser negativo' } })}
            />
          </Field>
        </FormGrid>
        <Field label="Descrição">
          <Textarea maxLength={4000} {...register('description')} />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={props.saving}>
            Salvar produto
          </Button>
        </DialogFooter>
      </FormStack>
    </Dialog>
  );
}
