import { Router } from 'express';
import { z } from 'zod';
import { AppDataSource } from '../database/data-source';
import { Category, MANAGER_ROLES, Product } from '../entities';
import { authorize } from '../middlewares/auth';
import { badRequest, notFound, paginated, paginationSchema, parseId, queryBoolean } from '../utils/http';

const router = Router();
const products = () => AppDataSource.getRepository(Product);

// O saldo (quantity) não é editável aqui: use as movimentações de estoque.
const bodySchema = z.object({
  sku: z.string().trim().min(1).max(60),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).nullable().optional(),
  unit: z.string().trim().min(1).max(10).toUpperCase().optional(),
  minQuantity: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).max(99_999_999.99).optional(),
  location: z.string().trim().max(80).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  active: z.boolean().optional(),
});

async function findOrFail(id: string): Promise<Product> {
  const product = await products().findOne({ where: { id }, relations: { category: true } });
  if (!product) throw notFound('Produto não encontrado');
  return product;
}

async function assertCategory(categoryId?: string | null): Promise<void> {
  if (!categoryId) return;
  const exists = await AppDataSource.getRepository(Category).exists({ where: { id: categoryId } });
  if (!exists) throw badRequest('Categoria não encontrada');
}

const withStatus = (p: Product) => ({ ...p, lowStock: p.quantity <= p.minQuantity });

/**
 * GET /api/products
 * Filtros: search (nome ou SKU), categoryId, active, lowStock=true
 */
router.get('/', async (req, res) => {
  const q = paginationSchema
    .extend({
      search: z.string().trim().optional(),
      categoryId: z.string().uuid().optional(),
      active: queryBoolean,
      lowStock: queryBoolean,
    })
    .parse(req.query);

  const qb = products().createQueryBuilder('p').leftJoinAndSelect('p.category', 'c');
  if (q.search) qb.andWhere('(p.name ILIKE :s OR p.sku ILIKE :s)', { s: `%${q.search}%` });
  if (q.categoryId) qb.andWhere('p.categoryId = :categoryId', { categoryId: q.categoryId });
  if (q.active !== undefined) qb.andWhere('p.active = :active', { active: q.active });
  if (q.lowStock === true) qb.andWhere('p.quantity <= p.minQuantity');
  if (q.lowStock === false) qb.andWhere('p.quantity > p.minQuantity');

  const [items, total] = await qb
    .orderBy('p.name', 'ASC')
    .skip((q.page - 1) * q.limit)
    .take(q.limit)
    .getManyAndCount();

  res.json(paginated(items.map(withStatus), total, q.page, q.limit));
});

router.get('/:id', async (req, res) => {
  res.json(withStatus(await findOrFail(parseId(req.params.id))));
});

router.post('/', authorize(...MANAGER_ROLES), async (req, res) => {
  const dto = bodySchema.parse(req.body);
  await assertCategory(dto.categoryId);
  const created = await products().save(products().create({ ...dto, quantity: 0 }));
  res.status(201).json(withStatus(await findOrFail(created.id)));
});

router.patch('/:id', authorize(...MANAGER_ROLES), async (req, res) => {
  const id = parseId(req.params.id);
  const dto = bodySchema.partial().parse(req.body);
  await findOrFail(id);
  await assertCategory(dto.categoryId);
  // update() altera só as colunas enviadas, sem regravar o saldo
  // (evita sobrescrever uma movimentação concorrente).
  if (Object.keys(dto).length > 0) await products().update(id, dto);
  res.json(withStatus(await findOrFail(id)));
});

/** Desativa o produto (o histórico de movimentações é preservado). */
router.delete('/:id', authorize(...MANAGER_ROLES), async (req, res) => {
  const id = parseId(req.params.id);
  await findOrFail(id);
  await products().update(id, { active: false });
  res.status(204).end();
});

export default router;
