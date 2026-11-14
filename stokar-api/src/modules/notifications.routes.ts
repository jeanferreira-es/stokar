import { Router } from 'express';
import { IsNull } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Notification } from '../entities';
import { currentUser } from '../middlewares/auth';
import { notFound, paginated, paginationSchema, parseId, queryBoolean } from '../utils/http';

const router = Router();
const notifications = () => AppDataSource.getRepository(Notification);

/** GET /api/notifications?unread=true — notificações do usuário autenticado */
router.get('/', async (req, res) => {
  const q = paginationSchema.extend({ unread: queryBoolean }).parse(req.query);
  const userId = currentUser(req).id;

  const [[items, total], unreadCount] = await Promise.all([
    notifications().findAndCount({
      where: { userId, ...(q.unread ? { readAt: IsNull() } : {}) },
      order: { createdAt: 'DESC' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    notifications().count({ where: { userId, readAt: IsNull() } }),
  ]);

  res.json({ ...paginated(items, total, q.page, q.limit), unreadCount });
});

/** GET /api/notifications/unread-count — leve, ideal para polling do "sininho" */
router.get('/unread-count', async (req, res) => {
  const count = await notifications().count({ where: { userId: currentUser(req).id, readAt: IsNull() } });
  res.json({ count });
});

/** PATCH /api/notifications/read-all */
router.patch('/read-all', async (req, res) => {
  const result = await notifications().update({ userId: currentUser(req).id, readAt: IsNull() }, { readAt: new Date() });
  res.json({ updated: result.affected ?? 0 });
});

/** PATCH /api/notifications/:id/read */
router.patch('/:id/read', async (req, res) => {
  const notification = await notifications().findOne({
    where: { id: parseId(req.params.id), userId: currentUser(req).id },
  });
  if (!notification) throw notFound('Notificação não encontrada');
  if (!notification.readAt) {
    notification.readAt = new Date();
    await notifications().save(notification);
  }
  res.json(notification);
});

/** DELETE /api/notifications/:id */
router.delete('/:id', async (req, res) => {
  const result = await notifications().delete({ id: parseId(req.params.id), userId: currentUser(req).id });
  if (!result.affected) throw notFound('Notificação não encontrada');
  res.status(204).end();
});

export default router;
