import { Router } from 'express';
import { In } from 'typeorm';
import { z } from 'zod';
import { AppDataSource } from '../database/data-source';
import { Contract, ContractService, ContractStatus, Customer, MANAGER_ROLES, Service, STAFF_ROLES, User, UserRole } from '../entities';
import { authorize, currentUser } from '../middlewares/auth';
import { customerIdOf, isClient } from '../services/access';
import { isContractUsable } from '../services/pricing.service';
import { badRequest, compact, notFound, paginated, paginationSchema, parseId } from '../utils/http';
import { dateField, money, optionalText } from '../utils/schemas';

const router = Router();
const contracts = () => AppDataSource.getRepository(Contract);

// Equipe da oficina e clientes (cada cliente só enxerga os próprios contratos)
router.use(authorize(...STAFF_ROLES, UserRole.CLIENT));

const pricesSchema = z
  .array(z.object({ serviceId: z.string().uuid(), price: money }))
  .max(500)
  .refine((items) => new Set(items.map((i) => i.serviceId)).size === items.length, {
    message: 'Há serviços repetidos na tabela de preços',
  });

const bodySchema = z.object({
  customerId: z.string().uuid(),
  title: z.string().trim().min(3).max(160),
  description: optionalText(10_000),
  status: z.nativeEnum(ContractStatus).optional(),
  startDate: dateField,
  endDate: dateField.nullable().optional(),
  monthlyValue: money.nullable().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  /** Tabela de preços negociados; substitui a anterior quando enviada */
  services: pricesSchema.optional(),
});

function serialize(c: Contract) {
  return {
    ...c,
    usable: isContractUsable(c),
    customer: c.customer
      ? { id: c.customer.id, name: c.customer.name, tradeName: c.customer.tradeName, document: c.customer.document }
      : undefined,
    services: c.services?.map((s) => ({
      id: s.id,
      serviceId: s.serviceId,
      price: s.price,
      service: s.service ? { id: s.service.id, name: s.service.name, price: s.service.price } : undefined,
    })),
  };
}

async function findFor(user: User, id: string): Promise<Contract> {
  const contract = await contracts().findOne({
    where: { id },
    relations: { customer: true, services: { service: true } },
  });
  if (!contract || (isClient(user) && contract.customerId !== user.customerId)) {
    throw notFound('Contrato não encontrado');
  }
  return contract;
}

async function assertServices(items: Array<{ serviceId: string }>): Promise<void> {
  if (items.length === 0) return;
  const ids = items.map((i) => i.serviceId);
  const found = await AppDataSource.getRepository(Service).count({ where: { id: In(ids) } });
  if (found !== ids.length) throw badRequest('Um ou mais serviços da tabela de preços não existem');
}

function assertPeriod(startDate: string, endDate?: string | null): void {
  if (endDate && endDate < startDate) throw badRequest('O fim da vigência não pode ser anterior ao início');
}

/** GET /api/contracts — filtros: customerId, status, search (título), usable=true (ativos e vigentes) */
router.get('/', async (req, res) => {
  const q = paginationSchema
    .extend({
      customerId: z.string().uuid().optional(),
      status: z.nativeEnum(ContractStatus).optional(),
      search: z.string().trim().optional(),
    })
    .parse(req.query);
  const user = currentUser(req);
  const customerId = isClient(user) ? customerIdOf(user) : q.customerId;

  const qb = contracts().createQueryBuilder('c').leftJoinAndSelect('c.customer', 'customer');
  if (customerId) qb.andWhere('c.customerId = :customerId', { customerId });
  if (q.status) qb.andWhere('c.status = :status', { status: q.status });
  if (q.search) {
    qb.andWhere('(c.title ILIKE :s OR customer.name ILIKE :s OR customer.tradeName ILIKE :s)', { s: `%${q.search}%` });
  }

  const [items, total] = await qb
    .orderBy('c.number', 'DESC')
    .skip((q.page - 1) * q.limit)
    .take(q.limit)
    .getManyAndCount();
  res.json(paginated(items.map(serialize), total, q.page, q.limit));
});

router.get('/:id', async (req, res) => {
  res.json(serialize(await findFor(currentUser(req), parseId(req.params.id))));
});

router.post('/', authorize(...MANAGER_ROLES), async (req, res) => {
  const dto = bodySchema.parse(req.body);
  assertPeriod(dto.startDate, dto.endDate);
  if (!(await AppDataSource.getRepository(Customer).exists({ where: { id: dto.customerId } }))) {
    throw badRequest('Cliente não encontrado');
  }
  await assertServices(dto.services ?? []);

  const { services, ...fields } = dto;
  const created = await contracts().save(
    contracts().create({
      ...fields,
      services: (services ?? []).map((s) => Object.assign(new ContractService(), s)),
    }),
  );
  res.status(201).json(serialize(await findFor(currentUser(req), created.id)));
});

router.patch('/:id', authorize(...MANAGER_ROLES), async (req, res) => {
  const id = parseId(req.params.id);
  // O cliente do contrato não muda depois de criado
  const dto = bodySchema.omit({ customerId: true }).partial().parse(req.body);
  const user = currentUser(req);
  const contract = await findFor(user, id);
  assertPeriod(dto.startDate ?? contract.startDate, dto.endDate === undefined ? contract.endDate : dto.endDate);
  if (dto.services) await assertServices(dto.services);

  await AppDataSource.transaction(async (manager) => {
    const { services, ...rest } = dto;
    const fields = compact(rest);
    if (Object.keys(fields).length > 0) await manager.update(Contract, id, fields);
    if (services) {
      await manager.delete(ContractService, { contractId: id });
      if (services.length > 0) {
        await manager.insert(
          ContractService,
          services.map((s) => ({ ...s, contractId: id })),
        );
      }
    }
  });
  res.json(serialize(await findFor(user, id)));
});

export default router;
