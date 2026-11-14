import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isManager, isStaff } from '@/models/permissions';
import { productsService } from '@/models/services/api';
import type { MovementType, Product, ProductInput } from '@/models/types';
import { useCurrentUser } from './AuthController';
import { keys, useAction, useCategoryOptions, useDebounced } from './shared';

export type StockFilter = 'all' | 'low' | 'ok' | 'inactive';

export function useProductsController() {
  const user = useCurrentUser();
  const [params] = useSearchParams();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState<StockFilter>(params.get('estoque') === 'baixo' ? 'low' : 'all');

  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [deactivating, setDeactivating] = useState<Product | null>(null);
  const [moving, setMoving] = useState<{ product: Product; type: MovementType } | null>(null);

  const term = useDebounced(search);
  const filters = {
    page,
    limit: 12,
    search: term,
    categoryId: categoryId || undefined,
    active: stock === 'inactive' ? false : true,
    lowStock: stock === 'low' ? true : stock === 'ok' ? false : undefined,
  };

  const list = useQuery({
    queryKey: [...keys.products, 'list', filters],
    queryFn: () => productsService.list(filters),
    placeholderData: keepPreviousData,
  });
  const categories = useCategoryOptions();

  const invalidate = [keys.products, keys.reports];
  const save = useAction(
    (input: ProductInput) =>
      editing && editing !== 'new' ? productsService.update(editing.id, input) : productsService.create(input),
    { invalidate, success: (p) => `${p.name} salvo`, onSuccess: () => setEditing(null) },
  );
  const deactivate = useAction((id: string) => productsService.deactivate(id), {
    invalidate,
    success: 'Produto desativado',
    onSuccess: () => setDeactivating(null),
  });
  const reactivate = useAction((id: string) => productsService.update(id, { active: true }), {
    invalidate,
    success: 'Produto reativado',
  });

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return {
    canManage: isManager(user),
    canMove: isStaff(user),

    rows: list.data?.items,
    meta: list.data?.meta,
    loading: list.isLoading,
    hasFilters: !!term || !!categoryId || stock !== 'all',

    search,
    setSearch: resetPage(setSearch),
    categoryId,
    setCategoryId: resetPage(setCategoryId),
    stock,
    setStock: resetPage(setStock),
    setPage,
    categories: categories.data ?? [],

    editing,
    openCreate: () => setEditing('new'),
    openEdit: setEditing,
    closeForm: () => setEditing(null),
    save: (input: ProductInput) => save.mutate(input),
    saving: save.isPending,

    deactivating,
    askDeactivate: setDeactivating,
    confirmDeactivate: () => deactivating && deactivate.mutate(deactivating.id),
    deactivatingBusy: deactivate.isPending,
    reactivate: (product: Product) => reactivate.mutate(product.id),

    moving,
    openMovement: (product: Product, type: MovementType) => setMoving({ product, type }),
    closeMovement: () => setMoving(null),
  };
}
