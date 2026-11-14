import { Router } from 'express';
import { ILike } from 'typeorm';
import { z } from 'zod';
import { AppDataSource } from '../database/data-source';
import { Category, MANAGER_ROLES } from '../entities';
import { authorize } from '../middlewares/auth';
import { notFound, paginated, paginationSchema, parseId } from '../utils/http';

const router = Router();
const categories = () => AppDataSource.getRepository(Category);

const bodySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(2000).nullable().optional(),
});

async function findOrFail(id: string): Promise<Category> {
  const category = await categories().findOne({ where: { id } });
  if (!category) throw notFound('Categoria não encontrada');
  return category;
}

router.get('/', async (req, res) => {
  const q = paginationSchema.extend({ search: z.string().trim().optional() }).parse(req.query);
  const [items, total] = await categories().findAndCount({
    where: q.search ? { name: ILike(`%${q.search}%`) } : {},
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
  res.status(201).json(await categories().save(categories().create(dto)));
});

router.patch('/:id', authorize(...MANAGER_ROLES), async (req, res) => {
  const dto = bodySchema.partial().parse(req.body);
  const category = await findOrFail(parseId(req.params.id));
  res.json(await categories().save(Object.assign(category, dto)));
});

/** Os produtos da categoria removida ficam sem categoria (ON DELETE SET NULL). */
router.delete('/:id', authorize(...MANAGER_ROLES), async (req, res) => {
  await categories().remove(await findOrFail(parseId(req.params.id)));
  res.status(204).end();
});

export default router;
