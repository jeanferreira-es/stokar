import { QueryClient, useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  categoriesService,
  contractsService,
  customersService,
  productsService,
  servicesService,
  serviceTypesService,
  suppliersService,
  usersService,
  vehiclesService,
} from '@/models/services/api';
import { ApiError, errorMessage } from '@/models/services/http';
import { STAFF_ROLES } from '@/models/permissions';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Erros de regra/permissão não melhoram repetindo; só falha de rede merece nova tentativa.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

/** Chaves de cache por domínio. Invalidar `[domínio]` atualiza todas as listas dele. */
export const keys = {
  products: ['products'] as const,
  categories: ['categories'] as const,
  suppliers: ['suppliers'] as const,
  movements: ['movements'] as const,
  requests: ['requests'] as const,
  notifications: ['notifications'] as const,
  users: ['users'] as const,
  reports: ['reports'] as const,
  customers: ['customers'] as const,
  vehicles: ['vehicles'] as const,
  serviceTypes: ['service-types'] as const,
  services: ['services'] as const,
  contracts: ['contracts'] as const,
  invoices: ['invoices'] as const,
  chat: ['chat'] as const,
  settings: ['settings'] as const,
};

export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

interface ActionOptions<TData> {
  success?: string | ((data: TData) => string);
  invalidate?: QueryKey[];
  onSuccess?: (data: TData) => void;
}

/** Mutation com o padrão do app: toast de sucesso/erro e invalidação de cache. */
export function useAction<TVars = void, TData = unknown>(
  mutationFn: (vars: TVars) => Promise<TData>,
  { success, invalidate = [], onSuccess }: ActionOptions<TData> = {},
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      invalidate.forEach((queryKey) => client.invalidateQueries({ queryKey }));
      if (success) toast.success(typeof success === 'function' ? success(data) : success);
      onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
  });
}

/* ---------- Opções para selects e buscas ---------- */

export function useCategoryOptions() {
  return useQuery({
    queryKey: [...keys.categories, 'options'],
    queryFn: () => categoriesService.list({ limit: 100 }).then((r) => r.items),
    staleTime: 60_000,
  });
}

export function useSupplierOptions(enabled = true) {
  return useQuery({
    queryKey: [...keys.suppliers, 'options'],
    queryFn: () => suppliersService.list({ limit: 100, active: true }).then((r) => r.items),
    staleTime: 60_000,
    enabled,
  });
}

/** Usuários que podem ser responsáveis por uma solicitação (perfis de equipe). */
export function useAssigneeOptions(enabled = true) {
  return useQuery({
    queryKey: [...keys.users, 'assignees'],
    queryFn: () =>
      usersService
        .list({ limit: 100, active: true })
        .then((r) => r.items.filter((u) => STAFF_ROLES.includes(u.role))),
    staleTime: 60_000,
    enabled,
  });
}

export function useProductSearch(search: string, enabled = true) {
  const term = useDebounced(search, 250);
  return useQuery({
    queryKey: [...keys.products, 'search', term],
    queryFn: () => productsService.list({ search: term, active: true, limit: 20 }).then((r) => r.items),
    enabled,
  });
}

/* ---------- Oficina ---------- */

export function useCustomerSearch(search: string, enabled = true) {
  const term = useDebounced(search, 250);
  return useQuery({
    queryKey: [...keys.customers, 'search', term],
    queryFn: () => customersService.list({ search: term, active: true, limit: 20 }).then((r) => r.items),
    enabled,
  });
}

/** Veículos ativos de um cliente (para o select da solicitação). */
export function useVehicleOptions(customerId?: string | null) {
  return useQuery({
    queryKey: [...keys.vehicles, 'options', customerId],
    queryFn: () => vehiclesService.list({ customerId: customerId!, active: true, limit: 100 }).then((r) => r.items),
    enabled: !!customerId,
  });
}

/** Contratos vigentes de um cliente. */
export function useContractOptions(customerId?: string | null) {
  return useQuery({
    queryKey: [...keys.contracts, 'options', customerId],
    queryFn: () =>
      contractsService
        .list({ customerId: customerId!, status: 'ACTIVE', limit: 100 })
        .then((r) => r.items.filter((c) => c.usable)),
    enabled: !!customerId,
  });
}

/** Catálogo ativo; com `contractId`, cada serviço traz o valor do contrato. */
export function useServiceOptions(contractId?: string | null, enabled = true) {
  return useQuery({
    queryKey: [...keys.services, 'options', contractId ?? null],
    queryFn: () =>
      servicesService.list({ active: true, limit: 100, contractId: contractId || undefined }).then((r) => r.items),
    staleTime: 60_000,
    enabled,
  });
}

export function useServiceTypeOptions() {
  return useQuery({
    queryKey: [...keys.serviceTypes, 'options'],
    queryFn: () => serviceTypesService.list({ limit: 100 }).then((r) => r.items),
    staleTime: 60_000,
  });
}
