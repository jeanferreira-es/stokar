import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { isManager } from '@/models/permissions';
import { stockService } from '@/models/services/api';
import type { MovementType, Product } from '@/models/types';
import { emptyToUndefined } from '@/utils/format';
import { useCurrentUser } from './AuthController';
import { keys, useAction, useSupplierOptions } from './shared';

/* ---------- Histórico de movimentações ---------- */
export function useStockController() {
  const user = useCurrentUser();
  const [page, setPage] = useState(1);
  const [type, setType] = useState<MovementType | 'ALL'>('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [creating, setCreating] = useState<MovementType | null>(null);

  const filters = {
    page,
    limit: 15,
    type: type === 'ALL' ? undefined : type,
    productId: product?.id,
    // O dia escolhido vale inteiro, no fuso do usuário
    from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
  };

  const list = useQuery({
    queryKey: [...keys.movements, 'list', filters],
    queryFn: () => stockService.movements(filters),
    placeholderData: keepPreviousData,
  });

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return {
    canAdjust: isManager(user),
    rows: list.data?.items,
    meta: list.data?.meta,
    loading: list.isLoading,
    hasFilters: type !== 'ALL' || !!from || !!to || !!product,
    setPage,
    type,
    setType: resetPage(setType),
    from,
    setFrom: resetPage(setFrom),
    to,
    setTo: resetPage(setTo),
    product,
    setProduct: resetPage(setProduct),
    creating,
    openCreate: setCreating,
    closeCreate: () => setCreating(null),
  };
}

/* ---------- Formulário de entrada / saída / ajuste ---------- */
export interface MovementFormValues {
  quantity: number;
  unitCost?: number;
  supplierId?: string;
  document?: string;
  reason?: string;
}

export function useMovementFormController(type: MovementType, onDone: () => void) {
  const user = useCurrentUser();
  const suppliers = useSupplierOptions(type === 'IN');

  const submit = useAction(
    ({ product, values }: { product: Product; values: MovementFormValues }) => {
      const common = { productId: product.id, document: emptyToUndefined(values.document) };
      const reason = emptyToUndefined(values.reason);
      if (type === 'IN') {
        return stockService.entry({
          ...common,
          quantity: values.quantity,
          unitCost: values.unitCost,
          supplierId: values.supplierId || undefined,
          reason,
        });
      }
      if (type === 'OUT') return stockService.exit({ ...common, quantity: values.quantity, reason });
      return stockService.adjust({ productId: product.id, newQuantity: values.quantity, reason: reason ?? '' });
    },
    {
      invalidate: [keys.movements, keys.products, keys.reports],
      success: (m) =>
        m.type === 'ADJUSTMENT'
          ? `Saldo ajustado para ${m.balanceAfter} ${m.product?.unit ?? ''}`
          : `${m.type === 'IN' ? 'Entrada' : 'Saída'} lançada. Saldo: ${m.balanceAfter} ${m.product?.unit ?? ''}`,
      onSuccess: onDone,
    },
  );

  return {
    canAdjust: isManager(user),
    suppliers: suppliers.data ?? [],
    submit: (product: Product, values: MovementFormValues) => submit.mutate({ product, values }),
    submitting: submit.isPending,
  };
}
