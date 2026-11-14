import { Router } from 'express';
import { ILike } from 'typeorm';
import { z } from 'zod';
import { AppDataSource } from '../database/data-source';
import { MANAGER_ROLES, STAFF_ROLES, Supplier } from '../entities';
import { authorize } from '../middlewares/auth';
import { notFound, paginated, paginationSchema, parseId, queryBoolean } from '../utils/http';

const router = Router();
const suppliers = () => AppDataSource.getRepository(Supplier);

const bodySchema = z.object({
  name: z.string().trim().min(2).max(160),
  document: z.string().trim().max(20).nullable().optional(),
  email: z.string().trim().toLowerCase().email().max(180).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  active: z.boolean().optional(),
});

async function findOrFail(id: string): Promise<Supplier> {
  const supplier = await suppliers().findOne({ where: { id } });
  if (!supplier) throw notFound('Fornecedor não encontrado');
  return supplier;
}

router.use(authorize(...STAFF_ROLES));

router.get('/', async (req, res) => {
  const q = paginationSchema.extend({ search: z.string().trim().optional(), active: queryBoolean }).parse(req.query);
  const [items, total] = await suppliers().findAndCount({
    where: {
      ...(q.search ? { name: ILike(`%${q.search}%`) } : {}),
      ...(q.active !== undefined ? { active: q.active } : {}),
    },
    order: { name: 'ASC' },
    skip: (q.page - 1) * q.limit,
    take: q.limit,
  });
  res.json(paginated(items, total, q.page, q.limit));
});

router.get('/:id', async (req, res) => {
  res.json(await findOrFail(parseId(req.params.id)));
});

router.post('/', authorize(...MANAGER_ROLES), async (req, res) => {
  const dto = bodySchema.parse(req.body);
  res.status(201).json(await suppliers().save(suppliers().create(dto)));
});

router.patch('/:id', authorize(...MANAGER_ROLES), async (req, res) => {
  const dto = bodySchema.partial().parse(req.body);
  const supplier = await findOrFail(parseId(req.params.id));
  res.json(await suppliers().save(Object.assign(supplier, dto)));
});

/** Desativa o fornecedor (o histórico de entradas é preservado). */
router.delete('/:id', authorize(...MANAGER_ROLES), async (req, res) => {
  const supplier = await findOrFail(parseId(req.params.id));
  supplier.active = false;
  await suppliers().save(supplier);
  res.status(204).end();
});

export default router;
