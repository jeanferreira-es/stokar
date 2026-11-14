import { Router } from 'express';
import { z } from 'zod';
import { AppDataSource } from '../database/data-source';
import { Customer, STAFF_ROLES, User, UserRole, Vehicle } from '../entities';
import { authorize, currentUser } from '../middlewares/auth';
import { customerIdOf, isClient } from '../services/access';
import { badRequest, compact, conflict, notFound, paginated, paginationSchema, parseId, queryBoolean } from '../utils/http';
import { optionalText } from '../utils/schemas';

const router = Router();
const vehicles = () => AppDataSource.getRepository(Vehicle);

// Equipe da oficina e clientes (cada cliente só enxerga os próprios veículos)
router.use(authorize(...STAFF_ROLES, UserRole.CLIENT));

const bodySchema = z.object({
  customerId: z.string().uuid().optional(),
  plate: z
    .string()
    .trim()
    .max(20)
    .nullable()
    .optional()
    .transform((v) => (v == null ? v : v.toUpperCase().replace(/[^A-Z0-9]/g, '') || null)),
  brand: optionalText(60),
  model: z.string().trim().min(1).max(100),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  color: optionalText(40),
  notes: optionalText(2000),
  active: z.boolean().optional(),
});

/** Carrega o veículo aplicando a regra de visibilidade (404 para não revelar a existência). */
async function findFor(user: User, id: string): Promise<Vehicle> {
  const vehicle = await vehicles().findOne({ where: { id }, relations: { customer: true } });
  if (!vehicle || (isClient(user) && vehicle.customerId !== user.customerId)) {
    throw notFound('Veículo não encontrado');
  }
  return vehicle;
}

async function assertPlateFree(plate: string | null | undefined, exceptId?: string): Promise<void> {
  if (!plate) return;
  const other = await vehicles().findOne({ where: { plate } });
  if (other && other.id !== exceptId) throw conflict('Já existe um veículo com esta placa');
}

const serialize = (v: Vehicle) => ({
  ...v,
  customer: v.customer ? { id: v.customer.id, name: v.customer.name, tradeName: v.customer.tradeName } : undefined,
});

/** GET /api/vehicles — filtros: customerId, search (placa, marca, modelo), active */
router.get('/', async (req, res) => {
  const q = paginationSchema
    .extend({ customerId: z.string().uuid().optional(), search: z.string().trim().optional(), active: queryBoolean })
    .parse(req.query);
  const user = currentUser(req);
  const customerId = isClient(user) ? customerIdOf(user) : q.customerId;

  const qb = vehicles().createQueryBuilder('v').leftJoinAndSelect('v.customer', 'c');
  if (customerId) qb.andWhere('v.customerId = :customerId', { customerId });
  if (q.search) qb.andWhere('(v.plate ILIKE :s OR v.brand ILIKE :s OR v.model ILIKE :s)', { s: `%${q.search}%` });
  if (q.active !== undefined) qb.andWhere('v.active = :active', { active: q.active });
  else if (isClient(user)) qb.andWhere('v.active = true');

  const [items, total] = await qb
    .orderBy('v.model', 'ASC')
    .skip((q.page - 1) * q.limit)
    .take(q.limit)
    .getManyAndCount();
  res.json(paginated(items.map(serialize), total, q.page, q.limit));
});

router.get('/:id', async (req, res) => {
  res.json(serialize(await findFor(currentUser(req), parseId(req.params.id))));
});

router.post('/', async (req, res) => {
  const dto = bodySchema.parse(req.body);
  const user = currentUser(req);
  const customerId = isClient(user) ? customerIdOf(user) : dto.customerId;
  if (!customerId) throw badRequest('Informe o cliente (customerId) dono do veículo');
  if (!(await AppDataSource.getRepository(Customer).exists({ where: { id: customerId } }))) {
    throw badRequest('Cliente não encontrado');
  }
  await assertPlateFree(dto.plate);

  const created = await vehicles().save(vehicles().create({ ...dto, customerId }));
  res.status(201).json(serialize(await findFor(user, created.id)));
});

router.patch('/:id', async (req, res) => {
  // O dono do veículo não muda: para transferir, cadastre no outro cliente
  const dto = compact(bodySchema.omit({ customerId: true }).partial().parse(req.body));
  const user = currentUser(req);
  const vehicle = await findFor(user, parseId(req.params.id));
  await assertPlateFree(dto.plate, vehicle.id);
  if (Object.keys(dto).length > 0) await vehicles().update(vehicle.id, dto);
  res.json(serialize(await findFor(user, vehicle.id)));
});

/** DELETE /api/vehicles/:id — desativa (o histórico de serviços do veículo é preservado) */
router.delete('/:id', async (req, res) => {
  const vehicle = await findFor(currentUser(req), parseId(req.params.id));
  await vehicles().update(vehicle.id, { active: false });
  res.status(204).end();
});

export default router;
