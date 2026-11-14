import { Router } from 'express';
import { z } from 'zod';
import { AppDataSource } from '../database/data-source';
import { MANAGER_ROLES, MovementType, STAFF_ROLES, StockMovement, Supplier } from '../entities';
import { authorize, currentUser } from '../middlewares/auth';
import { applyMovement, dispatchStockAlerts, MovementInput } from '../services/stock.service';
import { badRequest, notFound, paginated, paginationSchema, parseId } from '../utils/http';

const router = Router();
const movements = () => AppDataSource.getRepository(StockMovement);

const quantity = z.number().positive('A quantidade deve ser maior que zero').max(99_999_999);
const reason = z.string().trim().max(255).optional();
const document = z.string().trim().max(60).optional();

const movementRelations = {
  product: true,
  supplier: true,
  user: true,
  serviceRequest: true,
} as const;

function serialize(m: StockMovement) {
  return {
    ...m,
    product: m.product ? { id: m.product.id, sku: m.product.sku, name: m.product.name, unit: m.product.unit } : undefined,
    supplier: m.supplier ? { id: m.supplier.id, name: m.supplier.name } : m.supplier,
    user: m.user ? { id: m.user.id, name: m.user.name } : undefined,
    serviceRequest: m.serviceRequest
      ? { id: m.serviceRequest.id, code: m.serviceRequest.code, title: m.serviceRequest.title }
      : m.serviceRequest,
  };
}

async function execute(input: MovementInput) {
  const result = await AppDataSource.transaction((manager) => applyMovement(manager, input));
  await dispatchStockAlerts([result.alert]);
  const movement = await movements().findOneOrFail({ where: { id: result.movement.id }, relations: movementRelations });
  return serialize(movement);
}

router.use(authorize(...STAFF_ROLES));

/** POST /api/stock/entries — entrada de mercadoria (compra, devolução...) */
router.post('/entries', async (req, res) => {
  const dto = z
    .object({
      productId: z.string().uuid(),
      quantity,
      unitCost: z.number().min(0).optional(),
      supplierId: z.string().uuid().optional(),
      document,
      reason,
    })
    .parse(req.body);

  if (dto.supplierId) {
    const exists = await AppDataSource.getRepository(Supplier).exists({ where: { id: dto.supplierId, active: true } });
    if (!exists) throw badRequest('Fornecedor não encontrado ou inativo');
  }

  res.status(201).json(await execute({ ...dto, type: MovementType.IN, userId: currentUser(req).id }));
});

/** POST /api/stock/exits — saída (consumo, venda, perda...). Bloqueia saldo negativo. */
router.post('/exits', async (req, res) => {
  const dto = z.object({ productId: z.string().uuid(), quantity, document, reason }).parse(req.body);
  res.status(201).json(await execute({ ...dto, type: MovementType.OUT, userId: currentUser(req).id }));
});

/** POST /api/stock/adjustments — ajuste de inventário: informa o saldo contado */
router.post('/adjustments', authorize(...MANAGER_ROLES), async (req, res) => {
  const dto = z
    .object({
      productId: z.string().uuid(),
      newQuantity: z.number().min(0).max(99_999_999),
      reason: z.string().trim().min(3, 'Informe o motivo do ajuste').max(255),
    })
    .parse(req.body);

  res.status(201).json(
    await execute({
      productId: dto.productId,
      quantity: dto.newQuantity,
      reason: dto.reason,
      type: MovementType.ADJUSTMENT,
      userId: currentUser(req).id,
    }),
  );
});

/**
 * GET /api/stock/movements
 * Filtros: productId, type, userId, serviceRequestId, from, to (datas ISO)
 */
router.get('/movements', async (req, res) => {
  const q = paginationSchema
    .extend({
      productId: z.string().uuid().optional(),
      type: z.nativeEnum(MovementType).optional(),
      userId: z.string().uuid().optional(),
      serviceRequestId: z.string().uuid().optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .parse(req.query);

  const qb = movements()
    .createQueryBuilder('m')
    .leftJoinAndSelect('m.product', 'product')
    .leftJoinAndSelect('m.supplier', 'supplier')
    .leftJoinAndSelect('m.user', 'user')
    .leftJoinAndSelect('m.serviceRequest', 'serviceRequest');

  if (q.productId) qb.andWhere('m.productId = :productId', { productId: q.productId });
  if (q.type) qb.andWhere('m.type = :type', { type: q.type });
  if (q.userId) qb.andWhere('m.userId = :userId', { userId: q.userId });
  if (q.serviceRequestId) qb.andWhere('m.serviceRequestId = :sr', { sr: q.serviceRequestId });
  if (q.from) qb.andWhere('m.createdAt >= :from', { from: q.from });
  if (q.to) qb.andWhere('m.createdAt <= :to', { to: q.to });

  const [items, total] = await qb
    .orderBy('m.createdAt', 'DESC')
    .skip((q.page - 1) * q.limit)
    .take(q.limit)
    .getManyAndCount();

  res.json(paginated(items.map(serialize), total, q.page, q.limit));
});

router.get('/movements/:id', async (req, res) => {
  const movement = await movements().findOne({ where: { id: parseId(req.params.id) }, relations: movementRelations });
  if (!movement) throw notFound('Movimentação não encontrada');
  res.json(serialize(movement));
});

export default router;
