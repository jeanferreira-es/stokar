import { Router } from 'express';
import { In } from 'typeorm';
import { z } from 'zod';
import { AppDataSource } from '../database/data-source';
import {
  Customer,
  Invoice,
  InvoiceStatus,
  MANAGER_ROLES,
  MovementType,
  NotificationType,
  Product,
  RequestOrigin,
  RequestPriority,
  RequestStatus,
  Service,
  ServiceRequest,
  ServiceRequestItem,
  ServiceRequestService,
  STAFF_ROLES,
  User,
  UserRole,
  Vehicle,
} from '../entities';
import { authorize, currentUser } from '../middlewares/auth';
import { customerIdOf, isClient, isManager, isStaff } from '../services/access';
import { notifyRoles, notifyUsers } from '../services/notification.service';
import { ContractPricing, isContractUsable, loadContractPricing, priceFor } from '../services/pricing.service';
import { computeTotals } from '../services/request-totals';
import { applyMovement, dispatchStockAlerts, StockAlert } from '../services/stock.service';
import { badRequest, compact, conflict, forbidden, notFound, paginated, paginationSchema, parseId } from '../utils/http';
import { dateField, money } from '../utils/schemas';

const router = Router();
const requests = () => AppDataSource.getRepository(ServiceRequest);

const STATUS_LABEL: Record<RequestStatus, string> = {
  OPEN: 'aberta',
  APPROVED: 'aprovada',
  IN_PROGRESS: 'em andamento',
  COMPLETED: 'concluída',
  REJECTED: 'rejeitada',
  CANCELLED: 'cancelada',
};

/** Enquanto a solicitação está nestes status, a equipe ainda pode ajustar serviços, peças e valores. */
const EDITABLE_BY_STAFF = [RequestStatus.OPEN, RequestStatus.APPROVED, RequestStatus.IN_PROGRESS];

const itemsSchema = z
  .array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().positive().max(99_999_999),
      /** Valor cobrado por unidade; sem ele, usa o preço de venda do produto */
      unitPrice: money.optional(),
    }),
  )
  .max(100)
  .refine((items) => new Set(items.map((i) => i.productId)).size === items.length, {
    message: 'Há produtos repetidos nos itens',
  });

const serviceLinesSchema = z
  .array(
    z
      .object({
        /** Serviço do catálogo. Sem ele, a linha é um serviço avulso (somente equipe) */
        serviceId: z.string().uuid().optional(),
        description: z.string().trim().min(2).max(200).optional(),
        quantity: z.number().positive().max(9999).default(1),
        /** Somente equipe: sobrepõe o valor do catálogo/contrato */
        unitPrice: money.optional(),
      })
      .refine((line) => line.serviceId || line.description, {
        message: 'Informe o serviço do catálogo ou uma descrição',
      }),
  )
  .max(100);

const bodySchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(1).max(10_000),
  priority: z.nativeEnum(RequestPriority).optional(),
  dueDate: dateField.nullable().optional(),
  customerId: z.string().uuid().nullable().optional(),
  contractId: z.string().uuid().nullable().optional(),
  vehicleId: z.string().uuid().nullable().optional(),
  origin: z.nativeEnum(RequestOrigin).optional(),
  discount: money.optional(),
  services: serviceLinesSchema.optional(),
  items: itemsSchema.optional(),
});
type Body = z.infer<typeof bodySchema>;

const person = (u?: User | null) => (u ? { id: u.id, name: u.name, email: u.email } : u);

/** O usuário é "dono": abriu a solicitação ou representa o cliente atendido. */
const isOwner = (user: User, r: ServiceRequest) =>
  r.requesterId === user.id || (isClient(user) && !!user.customerId && r.customerId === user.customerId);

function serialize(r: ServiceRequest, viewer: User, invoice?: Invoice | null) {
  return {
    ...r,
    requester: person(r.requester),
    assignee: person(r.assignee),
    customer: r.customer
      ? {
          id: r.customer.id,
          type: r.customer.type,
          name: r.customer.name,
          tradeName: r.customer.tradeName,
          document: r.customer.document,
          phone: r.customer.phone,
        }
      : r.customer,
    contract: r.contract ? { id: r.contract.id, code: r.contract.code, title: r.contract.title } : r.contract,
    vehicle: r.vehicle
      ? {
          id: r.vehicle.id,
          plate: r.vehicle.plate,
          brand: r.vehicle.brand,
          model: r.vehicle.model,
          year: r.vehicle.year,
          color: r.vehicle.color,
        }
      : r.vehicle,
    services: r.services?.map((s) => ({
      id: s.id,
      serviceId: s.serviceId,
      description: s.description,
      quantity: s.quantity,
      unitPrice: s.unitPrice,
      total: Math.round(s.quantity * s.unitPrice * 100) / 100,
    })),
    items: r.items?.map((i) => ({
      id: i.id,
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: Math.round(i.quantity * i.unitPrice * 100) / 100,
      product: i.product
        ? {
            id: i.product.id,
            sku: i.product.sku,
            name: i.product.name,
            unit: i.product.unit,
            // O saldo em estoque é informação interna: não vai para o cliente do aplicativo
            ...(isClient(viewer) ? {} : { available: i.product.quantity }),
          }
        : undefined,
    })),
    totals: r.services && r.items ? computeTotals(r) : undefined,
    ...(invoice !== undefined
      ? { invoice: invoice ? { id: invoice.id, code: invoice.code, total: invoice.total, issuedAt: invoice.issuedAt } : null }
      : {}),
  };
}

/** Carrega a solicitação completa e aplica a regra de visibilidade. */
async function loadFor(user: User, id: string): Promise<ServiceRequest> {
  const request = await requests().findOne({
    where: { id },
    relations: {
      requester: true,
      assignee: true,
      customer: true,
      contract: true,
      vehicle: true,
      services: true,
      items: { product: true },
    },
  });
  // Quem não é da equipe só enxerga o que é seu (404 para não revelar a existência)
  if (!request || (!isStaff(user) && !isOwner(user, request))) {
    throw notFound('Solicitação não encontrada');
  }
  return request;
}

const activeInvoice = (serviceRequestId: string) =>
  AppDataSource.getRepository(Invoice).findOne({ where: { serviceRequestId, status: InvoiceStatus.ISSUED } });

async function respond(user: User, id: string) {
  const [request, invoice] = await Promise.all([loadFor(user, id), activeInvoice(id)]);
  return serialize(request, user, invoice);
}

function assertStatus(request: ServiceRequest, ...allowed: RequestStatus[]): void {
  if (!allowed.includes(request.status)) {
    throw conflict(`Ação não permitida: a solicitação está ${STATUS_LABEL[request.status]}`);
  }
}

/** Usuários do aplicativo ligados ao cliente da solicitação. */
async function customerUserIds(customerId: string | null): Promise<string[]> {
  if (!customerId) return [];
  const users = await AppDataSource.getRepository(User).find({
    select: { id: true },
    where: { customerId, role: UserRole.CLIENT, active: true },
  });
  return users.map((u) => u.id);
}

/** Quem acompanha a solicitação: solicitante, responsável e os usuários do cliente (menos quem agiu). */
async function audience(request: ServiceRequest, actorId: string): Promise<string[]> {
  const ids = [request.requesterId, request.assigneeId, ...(await customerUserIds(request.customerId))];
  return [...new Set(ids.filter((id): id is string => !!id && id !== actorId))];
}

/* ---------- Cliente, contrato e veículo ---------- */

interface Links {
  customerId: string | null;
  contractId: string | null;
  vehicleId: string | null;
  pricing: ContractPricing | null;
}

/**
 * Resolve e valida cliente/contrato/veículo. Regras:
 * - CLIENT: sempre o próprio cadastro (customerId enviado é ignorado);
 * - equipe: pode indicar qualquer cliente;
 * - demais perfis (REQUESTER): solicitação interna, sem cliente;
 * - contrato e veículo precisam ser do mesmo cliente; o contrato precisa estar vigente.
 */
async function resolveLinks(user: User, dto: Partial<Body>, current?: ServiceRequest): Promise<Links> {
  let customerId: string | null;
  if (isClient(user)) customerId = customerIdOf(user);
  else if (!isStaff(user)) customerId = null;
  else customerId = dto.customerId === undefined ? (current?.customerId ?? null) : dto.customerId;

  const customerChanged = !!current && current.customerId !== customerId;
  const pick = (sent: string | null | undefined, previous: string | null | undefined) =>
    sent !== undefined ? sent : customerChanged ? null : (previous ?? null);
  const contractId = customerId ? pick(dto.contractId, current?.contractId) : null;
  const vehicleId = customerId ? pick(dto.vehicleId, current?.vehicleId) : null;

  if (customerId && (!current || customerChanged)) {
    const customer = await AppDataSource.getRepository(Customer).findOne({ where: { id: customerId } });
    if (!customer) throw badRequest('Cliente não encontrado');
    if (!customer.active) throw conflict(`O cliente "${customer.name}" está inativo`);
  }

  if (vehicleId && vehicleId !== current?.vehicleId) {
    const vehicle = await AppDataSource.getRepository(Vehicle).findOne({ where: { id: vehicleId } });
    if (!vehicle || vehicle.customerId !== customerId) throw badRequest('O veículo não pertence a este cliente');
  }

  let pricing: ContractPricing | null = null;
  if (contractId) {
    pricing = await loadContractPricing(contractId);
    if (!pricing || pricing.contract.customerId !== customerId) {
      throw badRequest('O contrato não pertence a este cliente');
    }
    if (contractId !== current?.contractId && !isContractUsable(pricing.contract)) {
      throw conflict(`O contrato ${pricing.contract.code} não está ativo ou está fora da vigência`);
    }
  }

  return { customerId, contractId, vehicleId, pricing };
}

/** Monta as linhas de serviço com descrição e valor (catálogo, contrato ou valor informado pela equipe). */
async function buildServiceLines(
  user: User,
  lines: NonNullable<Body['services']>,
  pricing: ContractPricing | null,
): Promise<Array<Pick<ServiceRequestService, 'serviceId' | 'description' | 'quantity' | 'unitPrice'>>> {
  const staff = isStaff(user);
  const ids = [...new Set(lines.map((l) => l.serviceId).filter((id): id is string => !!id))];
  const catalog = ids.length ? await AppDataSource.getRepository(Service).find({ where: { id: In(ids) } }) : [];
  const byId = new Map(catalog.map((s) => [s.id, s]));

  return lines.map((line) => {
    if (!line.serviceId) {
      if (!staff) throw forbidden('Escolha um serviço do catálogo');
      return { serviceId: null, description: line.description!, quantity: line.quantity, unitPrice: line.unitPrice ?? 0 };
    }
    const service = byId.get(line.serviceId);
    if (!service) throw badRequest('Um ou mais serviços não existem no catálogo');
    if (!service.active && !staff) throw badRequest(`O serviço "${service.name}" não está mais disponível`);
    return {
      serviceId: service.id,
      description: (staff && line.description) || service.name,
      quantity: line.quantity,
      unitPrice: staff && line.unitPrice !== undefined ? line.unitPrice : priceFor(service, pricing),
    };
  });
}

/** Monta as peças com o valor cobrado (informado pela equipe ou o preço de venda do produto). */
async function buildItems(
  items: NonNullable<Body['items']>,
): Promise<Array<Pick<ServiceRequestItem, 'productId' | 'quantity' | 'unitPrice'>>> {
  if (items.length === 0) return [];
  const ids = items.map((i) => i.productId);
  const products = await AppDataSource.getRepository(Product).find({ where: { id: In(ids), active: true } });
  if (products.length !== ids.length) throw badRequest('Um ou mais produtos dos itens não existem ou estão inativos');
  const byId = new Map(products.map((p) => [p.id, p]));
  return items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    unitPrice: i.unitPrice ?? byId.get(i.productId)!.salePrice,
  }));
}

/** Peças do estoque e desconto são decisões da oficina. */
function assertStaffOnlyFields(user: User, dto: Partial<Body>): void {
  if (isStaff(user)) return;
  if (isClient(user) && dto.items && dto.items.length > 0) {
    throw forbidden('As peças são definidas pela oficina durante o atendimento');
  }
  if (dto.discount) throw forbidden('O desconto é definido pela oficina');
  if (!isClient(user) && dto.services && dto.services.length > 0) {
    throw forbidden('Seu perfil não lança serviços do catálogo');
  }
}

/**
 * POST /api/service-requests — qualquer usuário autenticado pode abrir.
 * Cliente (aplicativo): abre para o próprio cadastro, escolhendo serviços do catálogo.
 * Equipe: registra o serviço para qualquer cliente, com serviços, peças e desconto.
 */
router.post('/', async (req, res) => {
  const dto = bodySchema.parse(req.body);
  const user = currentUser(req);
  assertStaffOnlyFields(user, dto);

  const links = await resolveLinks(user, dto);
  const [services, items] = await Promise.all([
    buildServiceLines(user, dto.services ?? [], links.pricing),
    buildItems(dto.items ?? []),
  ]);

  const created = await requests().save(
    requests().create({
      title: dto.title,
      description: dto.description,
      priority: dto.priority ?? RequestPriority.MEDIUM,
      dueDate: dto.dueDate ?? null,
      requesterId: user.id,
      customerId: links.customerId,
      contractId: links.contractId,
      vehicleId: links.vehicleId,
      origin: dto.origin ?? RequestOrigin.WEB,
      discount: isStaff(user) ? (dto.discount ?? 0) : 0,
      services: services.map((s) => Object.assign(new ServiceRequestService(), s)),
      items: items.map((i) => Object.assign(new ServiceRequestItem(), i)),
    }),
  );

  const request = await loadFor(user, created.id);
  const data = { serviceRequestId: request.id, code: request.code };
  await notifyRoles(
    MANAGER_ROLES,
    {
      type: NotificationType.REQUEST_CREATED,
      title: `Nova solicitação ${request.code}`,
      message:
        `${user.name} abriu a solicitação "${request.title}" (prioridade ${request.priority})` +
        (request.customer ? ` para ${request.customer.name}.` : '.'),
      data,
    },
    { exclude: [user.id] },
  );
  // Serviço registrado pela oficina: o cliente passa a acompanhar pelo aplicativo
  if (isStaff(user)) {
    await notifyUsers(await customerUserIds(request.customerId), {
      type: NotificationType.REQUEST_CREATED,
      title: `Serviço ${request.code} registrado`,
      message: `A oficina registrou o serviço "${request.title}" para você.`,
      data,
    });
  }

  res.status(201).json(serialize(request, user, null));
});

/**
 * GET /api/service-requests
 * Filtros: status, priority, requesterId, assigneeId, customerId, vehicleId, contractId, search.
 * Quem não é da equipe vê apenas o que abriu ou o que é do seu cadastro de cliente.
 */
router.get('/', async (req, res) => {
  const q = paginationSchema
    .extend({
      status: z.nativeEnum(RequestStatus).optional(),
      priority: z.nativeEnum(RequestPriority).optional(),
      requesterId: z.string().uuid().optional(),
      assigneeId: z.string().uuid().optional(),
      customerId: z.string().uuid().optional(),
      vehicleId: z.string().uuid().optional(),
      contractId: z.string().uuid().optional(),
      search: z.string().trim().optional(),
    })
    .parse(req.query);
  const user = currentUser(req);

  const qb = requests()
    .createQueryBuilder('r')
    .leftJoinAndSelect('r.requester', 'requester')
    .leftJoinAndSelect('r.assignee', 'assignee')
    .leftJoinAndSelect('r.customer', 'customer')
    .leftJoinAndSelect('r.vehicle', 'vehicle')
    .leftJoinAndSelect('r.contract', 'contract')
    .leftJoinAndSelect('r.services', 'services')
    .leftJoinAndSelect('r.items', 'items');

  if (isStaff(user)) {
    if (q.requesterId) qb.andWhere('r.requesterId = :requesterId', { requesterId: q.requesterId });
    if (q.customerId) qb.andWhere('r.customerId = :customerId', { customerId: q.customerId });
  } else if (isClient(user) && user.customerId) {
    qb.andWhere('(r.requesterId = :me OR r.customerId = :mine)', { me: user.id, mine: user.customerId });
  } else {
    qb.andWhere('r.requesterId = :me', { me: user.id });
  }
  if (q.assigneeId) qb.andWhere('r.assigneeId = :assigneeId', { assigneeId: q.assigneeId });
  if (q.vehicleId) qb.andWhere('r.vehicleId = :vehicleId', { vehicleId: q.vehicleId });
  if (q.contractId) qb.andWhere('r.contractId = :contractId', { contractId: q.contractId });
  if (q.status) qb.andWhere('r.status = :status', { status: q.status });
  if (q.priority) qb.andWhere('r.priority = :priority', { priority: q.priority });
  if (q.search) {
    qb.andWhere(
      '(r.title ILIKE :s OR r.description ILIKE :s OR customer.name ILIKE :s OR customer.tradeName ILIKE :s OR vehicle.plate ILIKE :s)',
      { s: `%${q.search}%` },
    );
  }

  const [items, total] = await qb
    .orderBy('r.createdAt', 'DESC')
    .skip((q.page - 1) * q.limit)
    .take(q.limit)
    .getManyAndCount();

  res.json(
    paginated(
      items.map((r) => serialize(r, user)),
      total,
      q.page,
      q.limit,
    ),
  );
});

router.get('/:id', async (req, res) => {
  res.json(await respond(currentUser(req), parseId(req.params.id)));
});

/**
 * PATCH /api/service-requests/:id
 * Dono: enquanto estiver aberta. Equipe: até a conclusão (para lançar serviços, peças e valores).
 * `services` e `items`, quando enviados, substituem as listas anteriores.
 */
router.patch('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const dto = bodySchema.partial().parse(req.body);
  const user = currentUser(req);

  const request = await loadFor(user, id);
  if (isStaff(user)) assertStatus(request, ...EDITABLE_BY_STAFF);
  else {
    if (!isOwner(user, request)) throw forbidden();
    assertStatus(request, RequestStatus.OPEN);
  }
  assertStaffOnlyFields(user, dto);
  if (await activeInvoice(id)) throw conflict('Esta solicitação já tem nota emitida. Cancele a nota para alterar');

  const links = await resolveLinks(user, dto, request);
  const services = dto.services ? await buildServiceLines(user, dto.services, links.pricing) : undefined;
  const items = dto.items ? await buildItems(dto.items) : undefined;

  await AppDataSource.transaction(async (manager) => {
    const fields = compact({
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      dueDate: dto.dueDate,
      discount: isStaff(user) ? dto.discount : undefined,
      customerId: links.customerId,
      contractId: links.contractId,
      vehicleId: links.vehicleId,
    });
    await manager.update(ServiceRequest, id, fields);

    if (services) {
      await manager.delete(ServiceRequestService, { serviceRequestId: id });
      if (services.length > 0) {
        await manager.insert(
          ServiceRequestService,
          services.map((s) => ({ ...s, serviceRequestId: id })),
        );
      }
    }
    if (items) {
      await manager.delete(ServiceRequestItem, { serviceRequestId: id });
      if (items.length > 0) {
        await manager.insert(
          ServiceRequestItem,
          items.map((i) => ({ ...i, serviceRequestId: id })),
        );
      }
    }
  });

  res.json(await respond(user, id));
});

/** Muda o status de forma atômica e avisa os interessados. */
async function transition(
  actor: User,
  id: string,
  options: {
    from: RequestStatus[];
    to: RequestStatus;
    changes?: Partial<ServiceRequest>;
    notificationType: NotificationType;
    detail?: string;
  },
): Promise<ServiceRequest> {
  const current = await loadFor(actor, id);
  assertStatus(current, ...options.from);

  // O filtro por status no UPDATE evita que duas ações simultâneas passem
  const result = await requests().update(
    { id, status: In(options.from) },
    { status: options.to, ...options.changes },
  );
  if (!result.affected) throw conflict('A solicitação foi alterada por outro usuário. Tente novamente');

  const updated = await loadFor(actor, id);
  await notifyUsers(await audience(updated, actor.id), {
    type: options.notificationType,
    title: `Solicitação ${updated.code} ${STATUS_LABEL[options.to]}`,
    message:
      `A solicitação "${updated.title}" foi marcada como ${STATUS_LABEL[options.to]} por ${actor.name}.` +
      (options.detail ? ` ${options.detail}` : ''),
    data: { serviceRequestId: updated.id, code: updated.code, status: options.to },
  });

  return updated;
}

/** POST /:id/approve — gestor aprova (opcionalmente já define o responsável) */
router.post('/:id/approve', authorize(...MANAGER_ROLES), async (req, res) => {
  const id = parseId(req.params.id);
  const dto = z.object({ assigneeId: z.string().uuid().optional() }).parse(req.body ?? {});
  if (dto.assigneeId) await assertAssignee(dto.assigneeId);
  const user = currentUser(req);

  const updated = await transition(user, id, {
    from: [RequestStatus.OPEN],
    to: RequestStatus.APPROVED,
    changes: { approvedAt: new Date(), ...(dto.assigneeId ? { assigneeId: dto.assigneeId } : {}) },
    notificationType: NotificationType.REQUEST_APPROVED,
  });
  res.json(serialize(updated, user, null));
});

/** POST /:id/reject — gestor rejeita informando o motivo */
router.post('/:id/reject', authorize(...MANAGER_ROLES), async (req, res) => {
  const id = parseId(req.params.id);
  const { reason } = z.object({ reason: z.string().trim().min(3, 'Informe o motivo').max(2000) }).parse(req.body);
  const user = currentUser(req);

  const updated = await transition(user, id, {
    from: [RequestStatus.OPEN],
    to: RequestStatus.REJECTED,
    changes: { statusReason: reason },
    notificationType: NotificationType.REQUEST_REJECTED,
    detail: `Motivo: ${reason}`,
  });
  res.json(serialize(updated, user, null));
});

async function assertAssignee(assigneeId: string): Promise<User> {
  const assignee = await AppDataSource.getRepository(User).findOne({ where: { id: assigneeId, active: true } });
  if (!assignee || !isStaff(assignee)) {
    throw badRequest('O responsável deve ser um usuário ativo com perfil ADMIN, MANAGER ou OPERATOR');
  }
  return assignee;
}

/** POST /:id/assign — gestor define/troca o responsável pelo atendimento */
router.post('/:id/assign', authorize(...MANAGER_ROLES), async (req, res) => {
  const id = parseId(req.params.id);
  const { assigneeId } = z.object({ assigneeId: z.string().uuid() }).parse(req.body);
  const user = currentUser(req);

  const request = await loadFor(user, id);
  assertStatus(request, ...EDITABLE_BY_STAFF);
  const assignee = await assertAssignee(assigneeId);

  await requests().update(id, { assigneeId });
  if (assignee.id !== user.id) {
    await notifyUsers([assignee.id], {
      type: NotificationType.REQUEST_ASSIGNED,
      title: `Solicitação ${request.code} atribuída a você`,
      message: `${user.name} atribuiu a você a solicitação "${request.title}".`,
      data: { serviceRequestId: request.id, code: request.code },
    });
  }
  res.json(await respond(user, id));
});

/** POST /:id/start — inicia o atendimento (assume como responsável se não houver um) */
router.post('/:id/start', authorize(...STAFF_ROLES), async (req, res) => {
  const id = parseId(req.params.id);
  const user = currentUser(req);
  const current = await loadFor(user, id);

  const updated = await transition(user, id, {
    from: [RequestStatus.APPROVED],
    to: RequestStatus.IN_PROGRESS,
    changes: { startedAt: new Date(), ...(current.assigneeId ? {} : { assigneeId: user.id }) },
    notificationType: NotificationType.REQUEST_STARTED,
  });
  res.json(serialize(updated, user, null));
});

/**
 * POST /:id/complete — conclui o atendimento e dá baixa no estoque dos itens.
 * Tudo em uma única transação: se faltar saldo de qualquer item, nada é baixado.
 */
router.post('/:id/complete', authorize(...STAFF_ROLES), async (req, res) => {
  const id = parseId(req.params.id);
  const dto = z.object({ resolutionNotes: z.string().trim().max(10_000).optional() }).parse(req.body ?? {});
  const user = currentUser(req);

  const alerts = await AppDataSource.transaction(async (manager) => {
    const request = await manager.getRepository(ServiceRequest).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!request) throw notFound('Solicitação não encontrada');
    assertStatus(request, RequestStatus.IN_PROGRESS);

    const items = await manager.getRepository(ServiceRequestItem).find({
      where: { serviceRequestId: id },
      order: { productId: 'ASC' }, // ordem fixa de travamento evita deadlocks
    });

    const stockAlerts: Array<StockAlert | undefined> = [];
    for (const item of items) {
      const { alert } = await applyMovement(manager, {
        productId: item.productId,
        type: MovementType.OUT,
        quantity: item.quantity,
        userId: user.id,
        serviceRequestId: id,
        reason: `Baixa da solicitação ${request.code}`,
      });
      stockAlerts.push(alert);
    }

    await manager.update(ServiceRequest, id, {
      status: RequestStatus.COMPLETED,
      completedAt: new Date(),
      resolutionNotes: dto.resolutionNotes ?? null,
    });
    return stockAlerts;
  });

  await dispatchStockAlerts(alerts);

  const updated = await loadFor(user, id);
  await notifyUsers(await audience(updated, user.id), {
    type: NotificationType.REQUEST_COMPLETED,
    title: `Solicitação ${updated.code} concluída`,
    message: `A solicitação "${updated.title}" foi concluída por ${user.name}.`,
    data: { serviceRequestId: updated.id, code: updated.code, status: updated.status },
  });
  res.json(serialize(updated, user, null));
});

/** POST /:id/cancel — dono ou gestor, enquanto não estiver em andamento */
router.post('/:id/cancel', async (req, res) => {
  const id = parseId(req.params.id);
  const dto = z.object({ reason: z.string().trim().max(2000).optional() }).parse(req.body ?? {});
  const user = currentUser(req);

  const current = await loadFor(user, id);
  if (!isOwner(user, current) && !isManager(user)) throw forbidden();

  const updated = await transition(user, id, {
    from: [RequestStatus.OPEN, RequestStatus.APPROVED],
    to: RequestStatus.CANCELLED,
    changes: { statusReason: dto.reason ?? null },
    notificationType: NotificationType.REQUEST_CANCELLED,
    detail: dto.reason ? `Motivo: ${dto.reason}` : undefined,
  });

  // Quando o próprio solicitante/cliente cancela, os gestores também são avisados
  if (!isStaff(user)) {
    await notifyRoles(MANAGER_ROLES, {
      type: NotificationType.REQUEST_CANCELLED,
      title: `Solicitação ${updated.code} cancelada`,
      message: `${user.name} cancelou a solicitação "${updated.title}".`,
      data: { serviceRequestId: updated.id, code: updated.code, status: updated.status },
    });
  }
  res.json(serialize(updated, user, null));
});

export default router;
