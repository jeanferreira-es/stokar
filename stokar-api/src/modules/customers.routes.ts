import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { AppDataSource } from '../database/data-source';
import { Contract, Customer, CustomerType, MANAGER_ROLES, STAFF_ROLES, User, UserRole, Vehicle } from '../entities';
import { authorize, currentUser } from '../middlewares/auth';
import { customerIdOf } from '../services/access';
import { compact, conflict, notFound, paginated, paginationSchema, parseId, queryBoolean } from '../utils/http';
import { documentField, emailField, optionalEmail, optionalText } from '../utils/schemas';
import { publicUser } from './users.routes';

const router = Router();
const customers = () => AppDataSource.getRepository(Customer);

const bodySchema = z.object({
  type: z.nativeEnum(CustomerType).optional(),
  name: z.string().trim().min(2).max(160),
  tradeName: optionalText(160),
  document: documentField,
  email: optionalEmail,
  phone: optionalText(30),
  address: optionalText(255),
  notes: optionalText(4000),
  active: z.boolean().optional(),
});

async function findOrFail(id: string): Promise<Customer> {
  const customer = await customers().findOne({ where: { id } });
  if (!customer) throw notFound('Cliente não encontrado');
  return customer;
}

async function assertDocumentFree(document: string | null | undefined, exceptId?: string): Promise<void> {
  if (!document) return;
  const other = await customers().findOne({ where: { document } });
  if (other && other.id !== exceptId) throw conflict('Já existe um cliente com este CPF/CNPJ');
}

/** Cadastro + veículos + contratos, como o aplicativo e a tela de detalhe precisam. */
async function profile(customer: Customer, options: { staff: boolean }) {
  const [vehicles, contracts, users] = await Promise.all([
    AppDataSource.getRepository(Vehicle).find({
      where: { customerId: customer.id, ...(options.staff ? {} : { active: true }) },
      order: { model: 'ASC' },
    }),
    AppDataSource.getRepository(Contract).find({ where: { customerId: customer.id }, order: { number: 'DESC' } }),
    options.staff
      ? AppDataSource.getRepository(User).find({ where: { customerId: customer.id }, order: { name: 'ASC' } })
      : Promise.resolve([]),
  ]);
  const { notes, ...visible } = customer;
  return {
    ...(options.staff ? customer : visible),
    vehicles,
    contracts,
    // Contas excluídas pelo próprio usuário (anonimizadas) não aparecem na lista de acessos
    ...(options.staff ? { users: users.filter((u) => !u.email.endsWith('@removido.invalid')).map(publicUser) } : {}),
  };
}

/* ---------- Aplicativo: o cliente consulta e atualiza o próprio cadastro ---------- */

/** GET /api/customers/me */
router.get('/me', authorize(UserRole.CLIENT), async (req, res) => {
  res.json(await profile(await findOrFail(customerIdOf(currentUser(req))), { staff: false }));
});

/** PATCH /api/customers/me */
router.patch('/me', authorize(UserRole.CLIENT), async (req, res) => {
  const dto = compact(bodySchema.omit({ type: true, notes: true, active: true }).partial().parse(req.body));
  const customer = await findOrFail(customerIdOf(currentUser(req)));
  await assertDocumentFree(dto.document, customer.id);
  await customers().save(Object.assign(customer, dto));
  res.json(await profile(customer, { staff: false }));
});

/* ---------- Equipe da oficina ---------- */
router.use(authorize(...STAFF_ROLES));

/** GET /api/customers — filtros: search (nome, fantasia, documento, e-mail), type, active */
router.get('/', async (req, res) => {
  const q = paginationSchema
    .extend({
      search: z.string().trim().optional(),
      type: z.nativeEnum(CustomerType).optional(),
      active: queryBoolean,
    })
    .parse(req.query);

  const qb = customers().createQueryBuilder('c');
  if (q.search) {
    const digits = q.search.replace(/\D/g, '');
    qb.andWhere(
      `(c.name ILIKE :s OR c.tradeName ILIKE :s OR c.email ILIKE :s${digits ? ' OR c.document LIKE :d' : ''})`,
      { s: `%${q.search}%`, d: `%${digits}%` },
    );
  }
  if (q.type) qb.andWhere('c.type = :type', { type: q.type });
  if (q.active !== undefined) qb.andWhere('c.active = :active', { active: q.active });

  const [items, total] = await qb
    .orderBy('c.name', 'ASC')
    .skip((q.page - 1) * q.limit)
    .take(q.limit)
    .getManyAndCount();
  res.json(paginated(items, total, q.page, q.limit));
});

/** GET /api/customers/:id — cadastro com veículos, contratos e usuários de acesso ao aplicativo */
router.get('/:id', async (req, res) => {
  res.json(await profile(await findOrFail(parseId(req.params.id)), { staff: true }));
});

router.post('/', async (req, res) => {
  const dto = bodySchema.parse(req.body);
  await assertDocumentFree(dto.document);
  res.status(201).json(await customers().save(customers().create(dto)));
});

router.patch('/:id', async (req, res) => {
  const dto = compact(bodySchema.partial().parse(req.body));
  const customer = await findOrFail(parseId(req.params.id));
  await assertDocumentFree(dto.document, customer.id);
  res.json(await customers().save(Object.assign(customer, dto)));
});

/** DELETE /api/customers/:id — desativa (o histórico de serviços e notas é preservado) */
router.delete('/:id', authorize(...MANAGER_ROLES), async (req, res) => {
  const customer = await findOrFail(parseId(req.params.id));
  await customers().update(customer.id, { active: false });
  res.status(204).end();
});

/** POST /api/customers/:id/users — gestor cria um acesso ao aplicativo para o cliente */
router.post('/:id/users', authorize(...MANAGER_ROLES), async (req, res) => {
  const dto = z
    .object({
      name: z.string().trim().min(2).max(120),
      email: emailField,
      password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres').max(72),
      phone: optionalText(30),
    })
    .parse(req.body);
  const customer = await findOrFail(parseId(req.params.id));

  const users = AppDataSource.getRepository(User);
  if (await users.findOne({ where: { email: dto.email } })) throw conflict('E-mail já cadastrado');

  const user = await users.save(
    users.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone ?? null,
      role: UserRole.CLIENT,
      customerId: customer.id,
      passwordHash: await bcrypt.hash(dto.password, 10),
    }),
  );
  res.status(201).json(publicUser(user));
});

export default router;
