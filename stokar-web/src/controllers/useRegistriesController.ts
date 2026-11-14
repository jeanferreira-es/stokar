import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { isAdmin, isManager } from '@/models/permissions';
import {
  categoriesService,
  suppliersService,
  usersService,
  type CategoryInput,
  type SupplierInput,
} from '@/models/services/api';
import type { Category, Supplier, User, UserRole } from '@/models/types';
import { useCurrentUser } from './AuthController';
import { keys, useAction, useDebounced } from './shared';

/** Estado comum das telas de cadastro: busca, página e diálogo de edição. */
function useListState<T>() {
  const [search, setSearchState] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [removing, setRemoving] = useState<T | null>(null);
  return {
    search,
    term: useDebounced(search),
    setSearch: (value: string) => {
      setSearchState(value);
      setPage(1);
    },
    page,
    setPage,
    editing,
    setEditing,
    removing,
    setRemoving,
  };
}

/* ---------- Categorias ---------- */
export function useCategoriesController() {
  const user = useCurrentUser();
  const state = useListState<Category>();
  const { editing, removing, setEditing, setRemoving } = state;
  const filters = { page: state.page, limit: 20, search: state.term };

  const list = useQuery({
    queryKey: [...keys.categories, 'list', filters],
    queryFn: () => categoriesService.list(filters),
    placeholderData: keepPreviousData,
  });

  const invalidate = [keys.categories, keys.products];
  const save = useAction(
    (input: CategoryInput) =>
      editing && editing !== 'new' ? categoriesService.update(editing.id, input) : categoriesService.create(input),
    { invalidate, success: 'Categoria salva', onSuccess: () => setEditing(null) },
  );
  const remove = useAction((id: string) => categoriesService.remove(id), {
    invalidate,
    success: 'Categoria excluída',
    onSuccess: () => setRemoving(null),
  });

  return {
    ...state,
    canManage: isManager(user),
    rows: list.data?.items,
    meta: list.data?.meta,
    loading: list.isLoading,
    save: (input: CategoryInput) => save.mutate(input),
    saving: save.isPending,
    confirmRemove: () => removing && remove.mutate(removing.id),
    removingBusy: remove.isPending,
  };
}

/* ---------- Fornecedores ---------- */
export function useSuppliersController() {
  const user = useCurrentUser();
  const state = useListState<Supplier>();
  const { editing, removing, setEditing, setRemoving } = state;
  const [showInactive, setShowInactive] = useState(false);
  const filters = { page: state.page, limit: 12, search: state.term, active: showInactive ? undefined : true };

  const list = useQuery({
    queryKey: [...keys.suppliers, 'list', filters],
    queryFn: () => suppliersService.list(filters),
    placeholderData: keepPreviousData,
  });

  const invalidate = [keys.suppliers];
  const save = useAction(
    (input: SupplierInput) =>
      editing && editing !== 'new' ? suppliersService.update(editing.id, input) : suppliersService.create(input),
    { invalidate, success: 'Fornecedor salvo', onSuccess: () => setEditing(null) },
  );
  const deactivate = useAction((id: string) => suppliersService.deactivate(id), {
    invalidate,
    success: 'Fornecedor desativado',
    onSuccess: () => setRemoving(null),
  });
  const reactivate = useAction((id: string) => suppliersService.update(id, { active: true }), {
    invalidate,
    success: 'Fornecedor reativado',
  });

  return {
    ...state,
    canManage: isManager(user),
    rows: list.data?.items,
    meta: list.data?.meta,
    loading: list.isLoading,
    showInactive,
    setShowInactive: (value: boolean) => {
      setShowInactive(value);
      state.setPage(1);
    },
    save: (input: SupplierInput) => save.mutate(input),
    saving: save.isPending,
    confirmRemove: () => removing && deactivate.mutate(removing.id),
    removingBusy: deactivate.isPending,
    reactivate: (supplier: Supplier) => reactivate.mutate(supplier.id),
  };
}

/* ---------- Usuários ---------- */
export interface UserFormInput {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

export function useUsersController() {
  const me = useCurrentUser();
  const state = useListState<User>();
  const { editing, removing, setEditing, setRemoving } = state;
  const [role, setRole] = useState<UserRole | ''>('');
  const filters = { page: state.page, limit: 12, search: state.term, role: role || undefined };

  const list = useQuery({
    queryKey: [...keys.users, 'list', filters],
    queryFn: () => usersService.list(filters),
    placeholderData: keepPreviousData,
  });

  const invalidate = [keys.users];
  const save = useAction(
    ({ name, email, role: newRole, password }: UserFormInput) =>
      editing && editing !== 'new'
        ? usersService.update(editing.id, { name, role: newRole, password: password || undefined })
        : usersService.create({ name, email, role: newRole, password: password ?? '' }),
    { invalidate, success: (u) => `${u.name} salvo`, onSuccess: () => setEditing(null) },
  );
  const deactivate = useAction((id: string) => usersService.deactivate(id), {
    invalidate,
    success: 'Usuário desativado',
    onSuccess: () => setRemoving(null),
  });
  const reactivate = useAction((id: string) => usersService.update(id, { active: true }), {
    invalidate,
    success: 'Usuário reativado',
  });

  return {
    ...state,
    me,
    /** Gestores só consultam; criar, editar e desativar é exclusivo do ADMIN. */
    canManage: isAdmin(me),
    rows: list.data?.items,
    meta: list.data?.meta,
    loading: list.isLoading,
    role,
    setRole: (value: UserRole | '') => {
      setRole(value);
      state.setPage(1);
    },
    save: (input: UserFormInput) => save.mutate(input),
    saving: save.isPending,
    confirmRemove: () => removing && deactivate.mutate(removing.id),
    removingBusy: deactivate.isPending,
    reactivate: (user: User) => reactivate.mutate(user.id),
  };
}
