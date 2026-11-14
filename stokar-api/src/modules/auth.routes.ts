import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { AppDataSource } from '../database/data-source';
import { Customer, CustomerType, User, UserRole } from '../entities';
import { authenticate, currentUser } from '../middlewares/auth';
import { badRequest, conflict, forbidden, unauthorized } from '../utils/http';
import { issueTokens, verifyToken } from '../utils/jwt';
import { documentField } from '../utils/schemas';
import { publicUser } from './users.routes';

const router = Router();
const users = () => AppDataSource.getRepository(User);

export const passwordSchema = z.string().min(8, 'A senha deve ter ao menos 8 caracteres').max(72);
const emailSchema = z.string().trim().toLowerCase().email('E-mail inválido').max(180);

const withSecrets = (where: string, params: Record<string, unknown>) =>
  users().createQueryBuilder('u').addSelect(['u.passwordHash', 'u.tokenVersion']).where(where, params).getOne();

/**
 * POST /api/auth/register
 * O primeiro usuário cadastrado vira ADMIN; os demais entram como REQUESTER.
 */
router.post('/register', async (req, res) => {
  const dto = z
    .object({ name: z.string().trim().min(2).max(120), email: emailSchema, password: passwordSchema })
    .parse(req.body);

  const isFirstUser = (await users().count()) === 0;
  if (!isFirstUser && !env.ALLOW_PUBLIC_REGISTRATION) {
    throw forbidden('Cadastro público desativado. Peça a um administrador para criar seu usuário');
  }
  if (await users().findOne({ where: { email: dto.email } })) throw conflict('E-mail já cadastrado');

  const user = await users().save(
    users().create({
      name: dto.name,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: isFirstUser ? UserRole.ADMIN : UserRole.REQUESTER,
      tokenVersion: 0,
    }),
  );

  res.status(201).json({ user: publicUser(user), ...issueTokens(user) });
});

/**
 * POST /api/auth/register-client — cadastro feito pelo cliente no aplicativo.
 * Cria o cadastro do cliente (pessoa ou empresa) e o usuário de acesso (perfil CLIENT).
 */
router.post('/register-client', async (req, res) => {
  const dto = z
    .object({
      name: z.string().trim().min(2).max(120),
      email: emailSchema,
      password: passwordSchema,
      phone: z.string().trim().max(30).optional(),
      customerType: z.nativeEnum(CustomerType).default(CustomerType.PERSON),
      /** Razão social, obrigatória quando customerType = COMPANY */
      companyName: z.string().trim().min(2).max(160).optional(),
      document: documentField,
    })
    .refine((d) => d.customerType !== CustomerType.COMPANY || !!d.companyName, {
      message: 'Informe o nome da empresa',
      path: ['companyName'],
    })
    .parse(req.body);

  if (!env.ALLOW_CLIENT_REGISTRATION) {
    throw forbidden('O cadastro pelo aplicativo está desativado. Peça o seu acesso à oficina');
  }
  if (await users().findOne({ where: { email: dto.email } })) throw conflict('E-mail já cadastrado');
  if (dto.document && (await AppDataSource.getRepository(Customer).exists({ where: { document: dto.document } }))) {
    // Não vincula automaticamente: quem digita um CNPJ não prova que representa a empresa
    throw conflict('Já existe um cliente com este CPF/CNPJ. Peça o seu acesso à oficina');
  }

  const passwordHash = await bcrypt.hash(dto.password, 10);
  const user = await AppDataSource.transaction(async (manager) => {
    const customer = await manager.save(
      manager.create(Customer, {
        type: dto.customerType,
        name: dto.customerType === CustomerType.COMPANY ? dto.companyName! : dto.name,
        document: dto.document ?? null,
        email: dto.email,
        phone: dto.phone || null,
      }),
    );
    return manager.save(
      manager.create(User, {
        name: dto.name,
        email: dto.email,
        phone: dto.phone || null,
        passwordHash,
        role: UserRole.CLIENT,
        customerId: customer.id,
        tokenVersion: 0,
      }),
    );
  });

  res.status(201).json({ user: publicUser(user), ...issueTokens(user) });
});

/** POST /api/auth/login */
router.post('/login', async (req, res) => {
  const dto = z.object({ email: emailSchema, password: z.string().min(1) }).parse(req.body);

  const user = await withSecrets('u.email = :email', { email: dto.email });
  const valid = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;
  if (!user || !valid) throw unauthorized('E-mail ou senha incorretos');
  if (!user.active) throw forbidden('Usuário desativado');

  res.json({ user: publicUser(user), ...issueTokens(user) });
});

/** POST /api/auth/refresh — troca um refresh token válido por um novo par de tokens */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = z.object({ refreshToken: z.string().min(1) }).parse(req.body);
  const payload = verifyToken(refreshToken, 'refresh');

  const user = await withSecrets('u.id = :id', { id: payload.sub });
  if (!user || !user.active || user.tokenVersion !== payload.tv) throw unauthorized('Sessão expirada');

  res.json(issueTokens(user));
});

/** POST /api/auth/logout — invalida todos os tokens emitidos para o usuário */
router.post('/logout', authenticate, async (req, res) => {
  await users().increment({ id: currentUser(req).id }, 'tokenVersion', 1);
  res.status(204).end();
});

/** GET /api/auth/me */
router.get('/me', authenticate, (req, res) => {
  res.json(publicUser(currentUser(req)));
});

/** PATCH /api/auth/me — atualiza nome, telefone e preferência de e-mail */
router.patch('/me', authenticate, async (req, res) => {
  const dto = z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      phone: z.string().trim().max(30).nullable().optional(),
      emailNotifications: z.boolean().optional(),
    })
    .parse(req.body);

  const user = currentUser(req);
  if (dto.name !== undefined) user.name = dto.name;
  if (dto.phone !== undefined) user.phone = dto.phone || null;
  if (dto.emailNotifications !== undefined) user.emailNotifications = dto.emailNotifications;
  await users().update(user.id, {
    name: user.name,
    phone: user.phone,
    emailNotifications: user.emailNotifications,
  });

  res.json(publicUser(user));
});

/** POST /api/auth/change-password — encerra as demais sessões e devolve novos tokens */
router.post('/change-password', authenticate, async (req, res) => {
  const dto = z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema }).parse(req.body);

  const user = await withSecrets('u.id = :id', { id: currentUser(req).id });
  if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
    throw badRequest('Senha atual incorreta');
  }

  user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
  user.tokenVersion += 1;
  await users().update(user.id, { passwordHash: user.passwordHash, tokenVersion: user.tokenVersion });

  res.json(issueTokens(user));
});

/**
 * DELETE /api/auth/me — o próprio usuário exclui a conta (exigência das lojas de aplicativos).
 * A conta é desativada e os dados pessoais do usuário são anonimizados. O histórico de
 * serviços e notas permanece no cadastro do cliente, por obrigação legal da oficina.
 * Usuários da equipe são gerenciados por um administrador em /api/users.
 */
router.delete('/me', authenticate, async (req, res) => {
  const { password } = z.object({ password: z.string().min(1) }).parse(req.body ?? {});
  const me = currentUser(req);
  if (me.role !== UserRole.CLIENT && me.role !== UserRole.REQUESTER) {
    throw forbidden('Contas da equipe são removidas por um administrador');
  }

  const user = await withSecrets('u.id = :id', { id: me.id });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw badRequest('Senha incorreta');

  await users().update(user.id, {
    name: 'Conta excluída',
    email: `excluido-${user.id}@removido.invalid`,
    phone: null,
    active: false,
    emailNotifications: false,
    passwordHash: await bcrypt.hash(`${user.id}:${Date.now()}:${Math.random()}`, 10),
    tokenVersion: user.tokenVersion + 1,
  });
  res.status(204).end();
});

export default router;
