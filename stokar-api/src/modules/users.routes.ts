import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { ILike } from 'typeorm';
import { z } from 'zod';
import { AppDataSource } from '../database/data-source';
import { Customer, MANAGER_ROLES, User, UserRole } from '../entities';
import { authorize, currentUser } from '../middlewares/auth';
import { badRequest, conflict, notFound, paginated, paginationSchema, parseId, queryBoolean } from '../utils/http';

const router = Router();
const users = () => AppDataSource.getRepository(User);

/** Remove campos sensíveis antes de devolver o usuário na resposta. */
export function publicUser(user: User) {
  const { id, name, email, phone, role, customerId, active, emailNotifications, createdAt, updatedAt } = user;
  return { id, name, email, phone, role, customerId, active, emailNotifications, createdAt, updatedAt };
}

/** O perfil CLIENT precisa de um cadastro de cliente; os demais perfis não podem ter um. */
async function resolveCustomer(role: UserRole, customerId?: string | null): Promise<string | null> {
  if (role !== UserRole.CLIENT) return null;
  if (!customerId) throw badRequest('Informe o cliente (customerId) para o perfil CLIENT');
  const exists = await AppDataSource.getRepository(Customer).exists({ where: { id: customerId } });
  if (!exists) throw badRequest('Cliente não encontrado');
  return customerId;
}

async function findOrFail(id: string): Promise<User> {
  const user = await users().findOne({ where: { id } });
  if (!user) throw notFound('Usuário não encontrado');
  return user;
}

/** GET /api/users — gestores também listam (para atribuir responsáveis) */
router.get('/', authorize(...MANAGER_ROLES), async (req, res) => {
  const q = paginationSchema
    .extend({
      search: z.string().trim().optional(),
      role: z.nativeEnum(UserRole).optional(),
      active: queryBoolean,
      customerId: z.string().uuid().optional(),
    })
    .parse(req.query);

  const base = {
    ...(q.role ? { role: q.role } : {}),
    ...(q.customerId ? { customerId: q.customerId } : {}),
    ...(q.active !== undefined ? { active: q.active } : {}),
  };
  const where = q.search
    ? [
        { ...base, name: ILike(`%${q.search}%`) },
        { ...base, email: ILike(`%${q.search}%`) },
      ]
    : base;

  const [items, total] = await users().findAndCount({
    where,
    order: { name: 'ASC' },
    skip: (q.page - 1) * q.limit,
    take: q.limit,
  });
  res.json(paginated(items.map(publicUser), total, q.page, q.limit));
});

router.get('/:id', authorize(...MANAGER_ROLES), async (req, res) => {
  res.json(publicUser(await findOrFail(parseId(req.params.id))));
});

/** POST /api/users — somente ADMIN */
router.post('/', authorize(UserRole.ADMIN), async (req, res) => {
  const dto = z
    .object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().toLowerCase().email().max(180),
      password: z.string().min(8).max(72),
      role: z.nativeEnum(UserRole).default(UserRole.REQUESTER),
      phone: z.string().trim().max(30).nullable().optional(),
      customerId: z.string().uuid().nullable().optional(),
    })
    .parse(req.body);

  if (await users().findOne({ where: { email: dto.email } })) throw conflict('E-mail já cadastrado');
  const customerId = await resolveCustomer(dto.role, dto.customerId);

  const user = await users().save(
    users().create({
      name: dto.name,
      email: dto.email,
      role: dto.role,
      phone: dto.phone || null,
      customerId,
      passwordHash: await bcrypt.hash(dto.password, 10),
    }),
  );
  res.status(201).json(publicUser(user));
});

/** PATCH /api/users/:id — somente ADMIN. Trocar a senha ou desativar encerra as sessões do usuário. */
router.patch('/:id', authorize(UserRole.ADMIN), async (req, res) => {
  const id = parseId(req.params.id);
  const dto = z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      role: z.nativeEnum(UserRole).optional(),
      active: z.boolean().optional(),
      password: z.string().min(8).max(72).optional(),
      phone: z.string().trim().max(30).nullable().optional(),
      customerId: z.string().uuid().nullable().optional(),
    })
    .parse(req.body);

  const user = await findOrFail(id);
  const me = currentUser(req);
  if (user.id === me.id && (dto.active === false || (dto.role && dto.role !== UserRole.ADMIN))) {
    throw badRequest('Você não pode desativar ou rebaixar o próprio usuário');
  }

  const changes: Partial<User> = {};
  if (dto.name !== undefined) changes.name = dto.name;
  if (dto.role !== undefined) changes.role = dto.role;
  if (dto.active !== undefined) changes.active = dto.active;
  if (dto.phone !== undefined) changes.phone = dto.phone || null;
  if (dto.role !== undefined || dto.customerId !== undefined) {
    const role = dto.role ?? user.role;
    changes.customerId = await resolveCustomer(role, dto.customerId === undefined ? user.customerId : dto.customerId);
  }
  if (dto.password !== undefined) changes.passwordHash = await bcrypt.hash(dto.password, 10);

  if (Object.keys(changes).length > 0) await users().update(id, changes);
  if (dto.password !== undefined || dto.active === false || dto.role !== undefined) {
    await users().increment({ id }, 'tokenVersion', 1);
  }

  res.json(publicUser(await findOrFail(id)));
});

/** DELETE /api/users/:id — desativa (o histórico de movimentações é preservado) */
router.delete('/:id', authorize(UserRole.ADMIN), async (req, res) => {
  const id = parseId(req.params.id);
  if (id === currentUser(req).id) throw badRequest('Você não pode desativar o próprio usuário');
  await findOrFail(id);
  await users().update(id, { active: false });
  await users().increment({ id }, 'tokenVersion', 1);
  res.status(204).end();
});

export default router;
