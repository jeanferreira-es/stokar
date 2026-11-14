import { Router } from 'express';
import { z } from 'zod';
import { AppDataSource } from '../database/data-source';
import { ChatMessage, Conversation, Notification, NotificationType, STAFF_ROLES, User } from '../entities';
import { authorize, currentUser } from '../middlewares/auth';
import { isStaff } from '../services/access';
import { notifyRoles, notifyUsers } from '../services/notification.service';
import { badRequest, forbidden, notFound, paginated, paginationSchema, parseId, queryBoolean } from '../utils/http';

/**
 * Chat entre o usuário do aplicativo e a equipe da oficina.
 * Cada usuário de fora da equipe tem uma única conversa; qualquer pessoa da equipe pode responder.
 * Não há WebSocket (a API roda em ambiente serverless): os clientes consultam
 * `GET /conversations/:id/messages?after=` em intervalos curtos.
 */
const router = Router();
const conversations = () => AppDataSource.getRepository(Conversation);
const messages = () => AppDataSource.getRepository(ChatMessage);

function serialize(c: Conversation, viewer: User) {
  const staff = isStaff(viewer);
  return {
    id: c.id,
    userId: c.userId,
    customerId: c.customerId,
    user: c.user ? { id: c.user.id, name: c.user.name, email: c.user.email, phone: c.user.phone } : undefined,
    customer: c.customer ? { id: c.customer.id, name: c.customer.name, tradeName: c.customer.tradeName } : c.customer,
    lastMessageAt: c.lastMessageAt,
    lastMessagePreview: c.lastMessagePreview,
    /** Mensagens ainda não lidas por quem está consultando */
    unread: staff ? c.unreadByStaff : c.unreadByClient,
    createdAt: c.createdAt,
  };
}

const serializeMessage = (m: ChatMessage) => ({
  id: m.id,
  conversationId: m.conversationId,
  fromStaff: m.fromStaff,
  body: m.body,
  sender: m.sender ? { id: m.sender.id, name: m.sender.name } : null,
  createdAt: m.createdAt,
});

async function getOrCreateFor(userId: string, customerId: string | null): Promise<Conversation> {
  await conversations()
    .createQueryBuilder()
    .insert()
    .values({ userId, customerId })
    .orIgnore()
    .execute();
  return conversations().findOneOrFail({ where: { userId }, relations: { user: true, customer: true } });
}

/** Equipe acessa qualquer conversa; os demais, só a própria. */
async function findFor(user: User, id: string): Promise<Conversation> {
  const conversation = await conversations().findOne({ where: { id }, relations: { user: true, customer: true } });
  if (!conversation || (!isStaff(user) && conversation.userId !== user.id)) {
    throw notFound('Conversa não encontrada');
  }
  return conversation;
}

/** GET /api/chat/unread-count — leve, para o indicador de mensagens novas */
router.get('/unread-count', async (req, res) => {
  const user = currentUser(req);
  if (isStaff(user)) {
    const row = await conversations()
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.unreadByStaff), 0)', 'messages')
      .addSelect('COUNT(*) FILTER (WHERE c.unreadByStaff > 0)', 'conversations')
      .getRawOne<{ messages: string; conversations: string }>();
    res.json({ count: Number(row?.messages ?? 0), conversations: Number(row?.conversations ?? 0) });
    return;
  }
  const mine = await conversations().findOne({ where: { userId: user.id } });
  res.json({ count: mine?.unreadByClient ?? 0, conversations: mine?.unreadByClient ? 1 : 0 });
});

/** GET /api/chat/conversations/mine — a conversa do usuário do aplicativo com a oficina (criada no primeiro acesso) */
router.get('/conversations/mine', async (req, res) => {
  const user = currentUser(req);
  if (isStaff(user)) throw forbidden('A equipe responde pelas conversas dos clientes em /chat/conversations');
  res.json(serialize(await getOrCreateFor(user.id, user.customerId), user));
});

/** GET /api/chat/conversations — equipe: caixa de entrada. Filtros: search, unread=true */
router.get('/conversations', authorize(...STAFF_ROLES), async (req, res) => {
  const q = paginationSchema.extend({ search: z.string().trim().optional(), unread: queryBoolean }).parse(req.query);
  const qb = conversations()
    .createQueryBuilder('c')
    .leftJoinAndSelect('c.user', 'user')
    .leftJoinAndSelect('c.customer', 'customer')
    .where('c.lastMessageAt IS NOT NULL');
  if (q.search) {
    qb.andWhere('(user.name ILIKE :s OR user.email ILIKE :s OR customer.name ILIKE :s OR customer.tradeName ILIKE :s)', {
      s: `%${q.search}%`,
    });
  }
  if (q.unread) qb.andWhere('c.unreadByStaff > 0');

  const [items, total] = await qb
    .orderBy('c.lastMessageAt', 'DESC')
    .skip((q.page - 1) * q.limit)
    .take(q.limit)
    .getManyAndCount();
  const user = currentUser(req);
  res.json(
    paginated(
      items.map((c) => serialize(c, user)),
      total,
      q.page,
      q.limit,
    ),
  );
});

/** POST /api/chat/conversations — equipe inicia (ou reabre) a conversa com um usuário do aplicativo */
router.post('/conversations', authorize(...STAFF_ROLES), async (req, res) => {
  const { userId } = z.object({ userId: z.string().uuid() }).parse(req.body);
  const target = await AppDataSource.getRepository(User).findOne({ where: { id: userId, active: true } });
  if (!target) throw badRequest('Usuário não encontrado');
  if (isStaff(target)) throw badRequest('A conversa é sempre com um usuário de fora da equipe');
  res.status(201).json(serialize(await getOrCreateFor(target.id, target.customerId), currentUser(req)));
});

router.get('/conversations/:id', async (req, res) => {
  const user = currentUser(req);
  res.json(serialize(await findFor(user, parseId(req.params.id)), user));
});

/**
 * GET /api/chat/conversations/:id/messages
 * Sem parâmetros: as mensagens mais recentes. `before` (ISO) carrega as anteriores;
 * `after` (ISO) traz só as novas (use no polling). Sempre em ordem cronológica.
 */
router.get('/conversations/:id/messages', async (req, res) => {
  const q = z
    .object({
      after: z.string().datetime({ offset: true }).optional(),
      before: z.string().datetime({ offset: true }).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    })
    .parse(req.query);
  const user = currentUser(req);
  const conversation = await findFor(user, parseId(req.params.id));

  const qb = messages()
    .createQueryBuilder('m')
    .leftJoinAndSelect('m.sender', 'sender')
    .where('m.conversationId = :id', { id: conversation.id });
  // O banco guarda microssegundos e o JSON só milissegundos: compara na mesma precisão
  if (q.after) qb.andWhere(`date_trunc('milliseconds', m.createdAt) > :after`, { after: q.after });
  if (q.before) qb.andWhere(`date_trunc('milliseconds', m.createdAt) < :before`, { before: q.before });

  const items = await qb
    .orderBy('m.createdAt', q.after ? 'ASC' : 'DESC')
    .take(q.limit)
    .getMany();
  if (!q.after) items.reverse();

  res.json({ items: items.map(serializeMessage), conversation: serialize(conversation, user) });
});

/** POST /api/chat/conversations/:id/messages — envia uma mensagem */
router.post('/conversations/:id/messages', async (req, res) => {
  const { body } = z.object({ body: z.string().trim().min(1, 'Escreva uma mensagem').max(4000) }).parse(req.body);
  const user = currentUser(req);
  const conversation = await findFor(user, parseId(req.params.id));
  const fromStaff = isStaff(user);
  const hadUnread = fromStaff ? conversation.unreadByClient > 0 : conversation.unreadByStaff > 0;

  const message = await AppDataSource.transaction(async (manager) => {
    const saved = await manager.save(
      manager.create(ChatMessage, { conversationId: conversation.id, senderId: user.id, fromStaff, body }),
    );
    await manager
      .createQueryBuilder()
      .update(Conversation)
      .set({
        lastMessageAt: saved.createdAt,
        lastMessagePreview: body.length > 200 ? `${body.slice(0, 197)}...` : body,
        // Quem envia leu a conversa; o outro lado ganha uma mensagem não lida
        ...(fromStaff
          ? { unreadByStaff: 0, unreadByClient: () => 'unread_by_client + 1' }
          : { unreadByClient: 0, unreadByStaff: () => 'unread_by_staff + 1' }),
      })
      .where('id = :id', { id: conversation.id })
      .execute();
    return saved;
  });

  // Uma notificação por "leva" de mensagens: só avisa se o outro lado estava em dia
  if (!hadUnread) {
    const payload = {
      type: NotificationType.CHAT_MESSAGE,
      title: fromStaff ? 'Nova mensagem da oficina' : `Nova mensagem de ${user.name}`,
      message: body.length > 140 ? `${body.slice(0, 137)}...` : body,
      data: { conversationId: conversation.id },
    };
    if (fromStaff) await notifyUsers([conversation.userId], payload);
    else await notifyRoles(STAFF_ROLES, payload);
  }

  res.status(201).json(serializeMessage({ ...message, sender: user } as ChatMessage));
});

/** POST /api/chat/conversations/:id/read — marca como lidas as mensagens recebidas */
router.post('/conversations/:id/read', async (req, res) => {
  const user = currentUser(req);
  const conversation = await findFor(user, parseId(req.params.id));
  await conversations().update(conversation.id, isStaff(user) ? { unreadByStaff: 0 } : { unreadByClient: 0 });
  // Quem abriu a conversa já viu as mensagens: o aviso de "nova mensagem" dela sai do sininho
  await AppDataSource.getRepository(Notification)
    .createQueryBuilder()
    .update()
    .set({ readAt: new Date() })
    .where('user_id = :userId AND type = :type AND read_at IS NULL', { userId: user.id, type: NotificationType.CHAT_MESSAGE })
    .andWhere(`data->>'conversationId' = :conversationId`, { conversationId: conversation.id })
    .execute();
  res.status(204).end();
});

export default router;
