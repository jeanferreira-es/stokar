import { Router } from 'express';
import { z } from 'zod';
import { AppDataSource } from '../database/data-source';
import {
  Invoice,
  InvoiceLine,
  InvoiceParty,
  InvoiceStatus,
  MANAGER_ROLES,
  NotificationType,
  RequestStatus,
  ServiceRequest,
  STAFF_ROLES,
  User,
  UserRole,
} from '../entities';
import { authorize, currentUser } from '../middlewares/auth';
import { customerIdOf, isClient } from '../services/access';
import { getCompanySettings } from '../services/company.service';
import { renderInvoicePdf } from '../services/invoice-pdf.service';
import { PAYMENT_LABEL } from '../services/payment-labels';
import { notifyUsers } from '../services/notification.service';
import { computeTotals } from '../services/request-totals';
import { badRequest, conflict, notFound, paginated, paginationSchema, parseId } from '../utils/http';
import { dateField } from '../utils/schemas';

const router = Router();
const invoices = () => AppDataSource.getRepository(Invoice);

// Equipe da oficina e clientes (cada cliente só enxerga as próprias notas)
router.use(authorize(...STAFF_ROLES, UserRole.CLIENT));

const cents = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

async function findFor(user: User, id: string): Promise<Invoice> {
  const invoice = await invoices().findOne({ where: { id } });
  if (!invoice || (isClient(user) && invoice.customerId !== user.customerId)) {
    throw notFound('Nota de serviço não encontrada');
  }
  return invoice;
}

/**
 * POST /api/invoices — emite a nota de serviço de uma solicitação concluída.
 * A nota guarda uma cópia dos dados (oficina, cliente, serviços, peças e valores).
 */
router.post('/', authorize(...STAFF_ROLES), async (req, res) => {
  const dto = z
    .object({ serviceRequestId: z.string().uuid(), notes: z.string().trim().max(2000).optional() })
    .parse(req.body);
  const user = currentUser(req);

  const request = await AppDataSource.getRepository(ServiceRequest).findOne({
    where: { id: dto.serviceRequestId },
    relations: { customer: true, contract: true, vehicle: true, services: true, items: { product: true } },
  });
  if (!request) throw notFound('Solicitação não encontrada');
  if (request.status !== RequestStatus.COMPLETED) {
    throw conflict('A nota só pode ser emitida depois que a solicitação for concluída');
  }

  const lines: InvoiceLine[] = [
    ...(request.services ?? []).map((s) => ({
      kind: 'SERVICE' as const,
      description: s.description,
      quantity: s.quantity,
      unit: null,
      unitPrice: s.unitPrice,
      total: cents(s.quantity * s.unitPrice),
    })),
    ...(request.items ?? []).map((i) => ({
      kind: 'PART' as const,
      description: i.product ? `${i.product.name} (${i.product.sku})` : 'Produto',
      quantity: i.quantity,
      unit: i.product?.unit ?? null,
      unitPrice: i.unitPrice,
      total: cents(i.quantity * i.unitPrice),
    })),
  ];
  if (lines.length === 0) throw badRequest('Lance ao menos um serviço ou peça na solicitação antes de emitir a nota');

  const company = await getCompanySettings();
  const issuer: InvoiceParty = {
    name: company.name,
    document: company.document,
    email: company.email,
    phone: company.phone,
    address: company.address,
  };
  const c = request.customer;
  const recipient: InvoiceParty | null = c
    ? { name: c.name, document: c.document, email: c.email, phone: c.phone, address: c.address }
    : null;
  const v = request.vehicle;
  const totals = computeTotals(request);
  const notes = [dto.notes, company.invoiceFooter].filter(Boolean).join('\n\n') || null;

  const invoice = await AppDataSource.transaction(async (manager) => {
    // Trava a solicitação para que duas emissões simultâneas não gerem duas notas
    await manager.getRepository(ServiceRequest).findOne({ where: { id: request.id }, lock: { mode: 'pessimistic_write' } });
    const existing = await manager.getRepository(Invoice).findOne({
      where: { serviceRequestId: request.id, status: InvoiceStatus.ISSUED },
    });
    if (existing) throw conflict(`Esta solicitação já tem a nota ${existing.code} emitida`);

    return manager.save(
      manager.create(Invoice, {
        serviceRequestId: request.id,
        customerId: request.customerId,
        issuer,
        recipient,
        reference: {
          requestCode: request.code!,
          title: request.title,
          vehicle: v ? [v.brand, v.model, v.year, v.plate ? `placa ${v.plate}` : null].filter(Boolean).join(' ') : null,
          contractCode: request.contract?.code ?? null,
          completedAt: request.completedAt ? request.completedAt.toISOString() : null,
        },
        lines,
        servicesTotal: totals.services,
        partsTotal: totals.parts,
        discount: totals.discount,
        total: totals.total,
        notes,
        issuedById: user.id,
      }),
    );
  });

  if (request.customerId) {
    const clients = await AppDataSource.getRepository(User).find({
      select: { id: true },
      where: { customerId: request.customerId, role: UserRole.CLIENT, active: true },
    });
    await notifyUsers(
      clients.map((u) => u.id),
      {
        type: NotificationType.INVOICE_ISSUED,
        title: `Nota ${invoice.code} disponível`,
        message: `A nota do serviço "${request.title}" foi emitida. Você pode abrir o PDF pelo aplicativo.`,
        data: { invoiceId: invoice.id, code: invoice.code, serviceRequestId: request.id },
      },
    );
  }

  res.status(201).json(await findFor(user, invoice.id));
});

/** GET /api/invoices — filtros: status, customerId, serviceRequestId, from, to (data de emissão), search */
router.get('/', async (req, res) => {
  const q = paginationSchema
    .extend({
      status: z.nativeEnum(InvoiceStatus).optional(),
      customerId: z.string().uuid().optional(),
      serviceRequestId: z.string().uuid().optional(),
      from: dateField.optional(),
      to: dateField.optional(),
      search: z.string().trim().optional(),
    })
    .parse(req.query);
  const user = currentUser(req);
  const customerId = isClient(user) ? customerIdOf(user) : q.customerId;

  const qb = invoices().createQueryBuilder('i');
  if (customerId) qb.andWhere('i.customerId = :customerId', { customerId });
  if (q.serviceRequestId) qb.andWhere('i.serviceRequestId = :serviceRequestId', { serviceRequestId: q.serviceRequestId });
  if (q.status) qb.andWhere('i.status = :status', { status: q.status });
  if (q.from) qb.andWhere('i.issuedAt >= :from', { from: `${q.from}T00:00:00` });
  if (q.to) qb.andWhere('i.issuedAt <= :to', { to: `${q.to}T23:59:59.999` });
  if (q.search) {
    const number = Number(q.search.replace(/\D/g, ''));
    qb.andWhere(
      `(i.recipient->>'name' ILIKE :s OR i.reference->>'title' ILIKE :s OR i.reference->>'requestCode' ILIKE :s${
        number ? ' OR i.number = :n' : ''
      })`,
      { s: `%${q.search}%`, n: number },
    );
  }

  const [items, total] = await qb
    .orderBy('i.number', 'DESC')
    .skip((q.page - 1) * q.limit)
    .take(q.limit)
    .getManyAndCount();
  res.json(paginated(items, total, q.page, q.limit));
});

router.get('/:id', async (req, res) => {
  res.json(await findFor(currentUser(req), parseId(req.params.id)));
});

/** GET /api/invoices/:id/pdf — a nota em PDF (application/pdf) */
router.get('/:id/pdf', async (req, res) => {
  const invoice = await findFor(currentUser(req), parseId(req.params.id));
  const [request, settings] = await Promise.all([
    AppDataSource.getRepository(ServiceRequest).findOne({
      select: { id: true, paidAt: true, paymentMethod: true },
      where: { id: invoice.serviceRequestId },
    }),
    getCompanySettings(),
  ]);
  const pdf = await renderInvoicePdf(invoice, {
    paidAt: request?.paidAt ?? null,
    methodLabel: request?.paymentMethod ? PAYMENT_LABEL[request.paymentMethod] : null,
    pixKey: settings.pixKey,
    instructions: settings.paymentInstructions,
  });
  res
    .status(200)
    .set({
      'Content-Type': 'application/pdf',
      'Content-Length': String(pdf.length),
      'Content-Disposition': `inline; filename="nota-${invoice.code}.pdf"`,
      'Cache-Control': 'private, no-store',
    })
    .end(pdf);
});

/** POST /api/invoices/:id/cancel — gestor cancela; a solicitação pode ser corrigida e receber outra nota */
router.post('/:id/cancel', authorize(...MANAGER_ROLES), async (req, res) => {
  const { reason } = z.object({ reason: z.string().trim().min(3, 'Informe o motivo').max(2000) }).parse(req.body);
  const user = currentUser(req);
  const invoice = await findFor(user, parseId(req.params.id));
  if (invoice.status === InvoiceStatus.CANCELLED) throw conflict('Esta nota já está cancelada');

  await invoices().update(invoice.id, {
    status: InvoiceStatus.CANCELLED,
    cancelledAt: new Date(),
    cancelReason: reason,
  });
  res.json(await findFor(user, invoice.id));
});

export default router;
