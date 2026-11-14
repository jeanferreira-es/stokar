import { EntityManager } from 'typeorm';
import { MovementType, NotificationType, Product, STAFF_ROLES, StockMovement } from '../entities';
import { badRequest, conflict, notFound } from '../utils/http';
import { round } from '../utils/numeric';
import { notifyRoles } from './notification.service';

export interface MovementInput {
  productId: string;
  type: MovementType;
  /** IN/OUT: quantidade movimentada. ADJUSTMENT: novo saldo contado. */
  quantity: number;
  userId: string;
  unitCost?: number | null;
  reason?: string | null;
  document?: string | null;
  supplierId?: string | null;
  serviceRequestId?: string | null;
}

export interface StockAlert {
  kind: NotificationType.LOW_STOCK | NotificationType.OUT_OF_STOCK;
  product: Product;
}

export interface MovementResult {
  movement: StockMovement;
  product: Product;
  alert?: StockAlert;
}

/**
 * Aplica uma movimentação de estoque. Deve ser chamada dentro de uma
 * transação: a linha do produto é travada (SELECT ... FOR UPDATE) para que
 * movimentações concorrentes não corrompam o saldo.
 */
export async function applyMovement(manager: EntityManager, input: MovementInput): Promise<MovementResult> {
  const product = await manager.getRepository(Product).findOne({
    where: { id: input.productId },
    lock: { mode: 'pessimistic_write' },
  });
  if (!product) throw notFound('Produto não encontrado');
  if (!product.active) throw conflict(`O produto "${product.name}" está inativo`);

  const before = product.quantity;
  let after: number;
  let moved: number;

  switch (input.type) {
    case MovementType.IN:
      moved = input.quantity;
      after = round(before + moved);
      break;
    case MovementType.OUT:
      moved = input.quantity;
      if (moved > before) {
        throw conflict(`Estoque insuficiente para "${product.name}"`, {
          productId: product.id,
          available: before,
          requested: moved,
        });
      }
      after = round(before - moved);
      break;
    case MovementType.ADJUSTMENT:
      after = round(input.quantity);
      moved = round(Math.abs(after - before));
      if (moved === 0) throw badRequest('O novo saldo é igual ao saldo atual');
      break;
    default:
      throw badRequest('Tipo de movimentação inválido');
  }

  // Custo médio ponderado nas entradas com custo informado
  if (input.type === MovementType.IN && input.unitCost != null && after > 0) {
    product.costPrice = round((before * product.costPrice + moved * input.unitCost) / after, 4);
  }
  product.quantity = after;
  await manager.save(product);

  const movement = await manager.save(
    manager.create(StockMovement, {
      type: input.type,
      quantity: moved,
      balanceBefore: before,
      balanceAfter: after,
      unitCost: input.unitCost ?? null,
      reason: input.reason ?? null,
      document: input.document ?? null,
      productId: product.id,
      supplierId: input.supplierId ?? null,
      serviceRequestId: input.serviceRequestId ?? null,
      userId: input.userId,
    }),
  );

  // Alerta apenas quando o saldo "cruza" o limite, para não repetir a cada saída
  let alert: StockAlert | undefined;
  if (after < before) {
    if (after === 0) alert = { kind: NotificationType.OUT_OF_STOCK, product };
    else if (after <= product.minQuantity && before > product.minQuantity)
      alert = { kind: NotificationType.LOW_STOCK, product };
  }

  return { movement, product, alert };
}

/** Envia os alertas de estoque. Chame depois do commit da transação. */
export async function dispatchStockAlerts(alerts: Array<StockAlert | undefined>): Promise<void> {
  for (const alert of alerts) {
    if (!alert) continue;
    const { product: p } = alert;
    const out = alert.kind === NotificationType.OUT_OF_STOCK;
    await notifyRoles(STAFF_ROLES, {
      type: alert.kind,
      title: out ? `Produto sem estoque: ${p.name}` : `Estoque baixo: ${p.name}`,
      message: out
        ? `O produto ${p.name} (SKU ${p.sku}) zerou o estoque.`
        : `O produto ${p.name} (SKU ${p.sku}) está com ${p.quantity} ${p.unit}; o mínimo é ${p.minQuantity} ${p.unit}.`,
      data: { productId: p.id, sku: p.sku, quantity: p.quantity, minQuantity: p.minQuantity },
    });
  }
}
