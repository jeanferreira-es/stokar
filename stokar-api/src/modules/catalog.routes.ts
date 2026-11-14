import { Router } from 'express';
import { ILike } from 'typeorm';
import { z } from 'zod';
import { AppDataSource } from '../database/data-source';
import { MANAGER_ROLES, Service, ServiceType } from '../entities';
import { authorize, currentUser } from '../middlewares/auth';
import { isClient, isStaff } from '../services/access';
import { loadContractPricing, priceFor } from '../services/pricing.service';
import { badRequest, compact, notFound, paginated, paginationSchema, parseId, queryBoolean } from '../utils/http';
import { money, optionalText } from '../utils/schemas';

/* =====================================================================
 * Tipos de serviço — /api/service-types
 * ===================================================================== */
export const serviceTypesRouter = Router();
const types = () => AppDataSource.getRepository(ServiceType);

const typeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: optionalText(2000),
  active: z.boolean().optional(),
});

async function findType(id: string): Promise<ServiceType> {
  const type = await types().findOne({ where: { id } });
  if (!type) throw notFound('Tipo de serviço não encontrado');
  return type;
}

/** GET /api/service-types — quem não é da equipe só vê os ativos */
serviceTypesRouter.get('/', async (req, res) => {
  const q = paginationSchema.extend({ search: z.string().trim().optional(), active: queryBoolean }).parse(req.query);
  const active = isStaff(currentUser(req)) ? q.active : true;
  const [items, total] = await types().findAndCount({
    where: {
      ...(q.search ? { name: ILike(`%${q.search}%`) } : {}),
      ...(active !== undefined ? { active } : {}),
    },
    order: { name: 'ASC' },
    skip: (q.page - 1) * q.limit,
    take: q.limit,
  });
  res.json(paginated(items, total, q.page, q.limit));
});

serviceTypesRouter.get('/:id', async (req, res) => {
  res.json(await findType(parseId(req.params.id)));
});

serviceTypesRouter.post('/', authorize(...MANAGER_ROLES), async (req, res) => {
  const dto = typeSchema.parse(req.body);
  res.status(201).json(await types().save(types().create(dto)));
});

serviceTypesRouter.patch('/:id', authorize(...MANAGER_ROLES), async (req, res) => {
  const dto = compact(typeSchema.partial().parse(req.body));
  const type = await findType(parseId(req.params.id));
  res.json(await types().save(Object.assign(type, dto)));
});

/** Os serviços do tipo removido ficam sem tipo (ON DELETE SET NULL). */
serviceTypesRouter.delete('/:id', authorize(...MANAGER_ROLES), async (req, res) => {
  await types().remove(await findType(parseId(req.params.id)));
  res.status(204).end();
});

/* =====================================================================
 * Serviços (catálogo com valores) — /api/services
 * ===================================================================== */
export const servicesRouter = Router();
const services = () => AppDataSource.getRepository(Service);

const serviceSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: optionalText(4000),
  price: money,
  estimatedMinutes: z.number().int().min(1).max(100_000).nullable().optional(),
  serviceTypeId: z.string().uuid().nullable().optional(),
  active: z.boolean().optional(),
});

async function findService(id: string): Promise<Service> {
  const service = await services().findOne({ where: { id }, relations: { serviceType: true } });
  if (!service) throw notFound('Serviço não encontrado');
  return service;
}

async function assertType(serviceTypeId?: string | null): Promise<void> {
  if (!serviceTypeId) return;
  if (!(await types().exists({ where: { id: serviceTypeId } }))) throw badRequest('Tipo de serviço não encontrado');
}

/**
 * GET /api/services
 * Filtros: search, serviceTypeId, active. Com `contractId`, cada serviço traz também
 * `contractPrice` (valor que vale para aquele contrato).
 */
servicesRouter.get('/', async (req, res) => {
  const q = paginationSchema
    .extend({
      search: z.string().trim().optional(),
      serviceTypeId: z.string().uuid().optional(),
      active: queryBoolean,
      contractId: z.string().uuid().optional(),
    })
    .parse(req.query);
  const user = currentUser(req);

  const qb = services().createQueryBuilder('s').leftJoinAndSelect('s.serviceType', 't');
  if (q.search) qb.andWhere('(s.name ILIKE :s OR s.description ILIKE :s)', { s: `%${q.search}%` });
  if (q.serviceTypeId) qb.andWhere('s.serviceTypeId = :serviceTypeId', { serviceTypeId: q.serviceTypeId });
  if (!isStaff(user)) qb.andWhere('s.active = true');
  else if (q.active !== undefined) qb.andWhere('s.active = :active', { active: q.active });

  const [items, total] = await qb
    .orderBy('s.name', 'ASC')
    .skip((q.page - 1) * q.limit)
    .take(q.limit)
    .getManyAndCount();

  let pricing = q.contractId ? await loadContractPricing(q.contractId) : null;
  // Um cliente só consulta os preços dos próprios contratos
  if (pricing && isClient(user) && pricing.contract.customerId !== user.customerId) pricing = null;

  res.json(
    paginated(
      items.map((s) => (pricing ? { ...s, contractPrice: priceFor(s, pricing) } : s)),
      total,
      q.page,
      q.limit,
    ),
  );
});

servicesRouter.get('/:id', async (req, res) => {
  res.json(await findService(parseId(req.params.id)));
});

servicesRouter.post('/', authorize(...MANAGER_ROLES), async (req, res) => {
  const dto = serviceSchema.parse(req.body);
  await assertType(dto.serviceTypeId);
  const created = await services().save(services().create(dto));
  res.status(201).json(await findService(created.id));
});

servicesRouter.patch('/:id', authorize(...MANAGER_ROLES), async (req, res) => {
  const id = parseId(req.params.id);
  const dto = compact(serviceSchema.partial().parse(req.body));
  await findService(id);
  await assertType(dto.serviceTypeId);
  if (Object.keys(dto).length > 0) await services().update(id, dto);
  res.json(await findService(id));
});

/** DELETE /api/services/:id — desativa (serviços já lançados e notas emitidas não mudam) */
servicesRouter.delete('/:id', authorize(...MANAGER_ROLES), async (req, res) => {
  const id = parseId(req.params.id);
  await findService(id);
  await services().update(id, { active: false });
  res.status(204).end();
});
