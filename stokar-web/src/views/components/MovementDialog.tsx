import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMovementFormController, type MovementFormValues } from '@/controllers/useStockController';
import { MOVEMENT_LABEL } from '@/models/labels';
import type { MovementType, Product } from '@/models/types';
import { formatQuantity, toNumber } from '@/utils/format';
import * as S from './MovementDialog.styles';
import { ProductPicker } from './ProductPicker';
import { Button, Dialog, DialogFooter, Field, FormGrid, FormStack, Input, Segmented, Select, Textarea } from './ui';

interface MovementDialogProps {
  type: MovementType;
  /** Produto já escolhido (quando aberto a partir da lista de produtos). */
  product?: Product | null;
  onClose: () => void;
}

const SUBMIT_LABEL: Record<MovementType, string> = {
  IN: 'Lançar entrada',
  OUT: 'Lançar saída',
  ADJUSTMENT: 'Ajustar saldo',
};

export function MovementDialog({ type: initialType, product: initialProduct, onClose }: MovementDialogProps) {
  const [type, setType] = useState<MovementType>(initialType);
  const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
  const [productError, setProductError] = useState(false);
  const c = useMovementFormController(type, onClose);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MovementFormValues>();

  const quantity = toNumber(watch('quantity')) ?? 0;
  const current = product?.quantity ?? 0;
  const next = type === 'IN' ? current + quantity : type === 'OUT' ? current - quantity : quantity;

  const types: MovementType[] = c.canAdjust ? ['IN', 'OUT', 'ADJUSTMENT'] : ['IN', 'OUT'];

  const onSubmit = handleSubmit((values) => {
    if (!product) {
      setProductError(true);
      return;
    }
    c.submit(product, values);
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Movimentar estoque"
      description="O saldo do produto só muda por movimentações, e cada uma fica registrada no histórico."
    >
      <FormStack onSubmit={onSubmit} noValidate>
        <Segmented
          label="Tipo de movimentação"
          value={type}
          onChange={setType}
          options={types.map((t) => ({ value: t, label: MOVEMENT_LABEL[t] }))}
        />

        <Field label="Produto" error={productError && !product ? 'Escolha o produto' : undefined}>
          <ProductPicker
            value={product}
            onChange={(p) => {
              setProduct(p);
              setProductError(false);
            }}
          />
        </Field>

        <FormGrid>
          <Field
            label={type === 'ADJUSTMENT' ? `Saldo contado${product ? ` (${product.unit})` : ''}` : `Quantidade${product ? ` (${product.unit})` : ''}`}
            error={errors.quantity?.message}
          >
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              {...register('quantity', {
                setValueAs: toNumber,
                validate: (v) => {
                  if (v === undefined) return 'Informe a quantidade';
                  if (type === 'ADJUSTMENT') return v >= 0 || 'O saldo não pode ser negativo';
                  if (v <= 0) return 'A quantidade deve ser maior que zero';
                  if (type === 'OUT' && product && v > product.quantity) {
                    return `Saldo insuficiente: há ${formatQuantity(product.quantity, product.unit)}`;
                  }
                  return true;
                },
              })}
            />
          </Field>

          {type === 'IN' && (
            <Field label="Custo unitário (R$)" hint="Opcional. Recalcula o custo médio do produto.">
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                {...register('unitCost', { setValueAs: toNumber })}
              />
            </Field>
          )}
          {type === 'IN' && (
            <Field label="Fornecedor">
              <Select {...register('supplierId')}>
                <option value="">Sem fornecedor</option>
                {c.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {type !== 'ADJUSTMENT' && (
            <Field label="Documento" hint="Nota fiscal, requisição…">
              <Input maxLength={60} {...register('document')} />
            </Field>
          )}
        </FormGrid>

        <Field label={type === 'ADJUSTMENT' ? 'Motivo do ajuste' : 'Observação'} error={errors.reason?.message}>
          <Textarea
            maxLength={255}
            style={{ minHeight: 72 }}
            {...register('reason', {
              validate: (v) =>
                type !== 'ADJUSTMENT' || (v?.trim().length ?? 0) >= 3 || 'Explique o motivo do ajuste',
            })}
          />
        </Field>

        {product && (
          <S.Balance>
            <div>
              Saldo atual
              <strong>{formatQuantity(current, product.unit)}</strong>
            </div>
            <ArrowRight aria-hidden />
            <div>
              Saldo após lançar
              <strong data-negative={next < 0}>{formatQuantity(next, product.unit)}</strong>
            </div>
          </S.Balance>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={c.submitting}>
            {SUBMIT_LABEL[type]}
          </Button>
        </DialogFooter>
      </FormStack>
    </Dialog>
  );
}
