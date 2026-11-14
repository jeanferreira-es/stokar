import nodemailer, { Transporter } from 'nodemailer';
import { In } from 'typeorm';
import { env } from '../config/env';
import { AppDataSource } from '../database/data-source';
import { Notification, NotificationType, User, UserRole } from '../entities';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  transporter = env.SMTP_HOST
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      })
    : null;
  return transporter;
}

async function sendEmails(users: User[], payload: NotificationPayload): Promise<void> {
  const mailer = getTransporter();
  if (!mailer) return;
  const recipients = users.filter((u) => u.emailNotifications).map((u) => u.email);
  if (recipients.length === 0) return;
  await mailer.sendMail({
    from: env.SMTP_FROM,
    bcc: recipients,
    subject: payload.title,
    text: payload.message,
  });
}

async function sendWebhook(users: User[], payload: NotificationPayload): Promise<void> {
  if (!env.NOTIFICATION_WEBHOOK_URL) return;
  await fetch(env.NOTIFICATION_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      // "text" permite apontar direto para webhooks do Slack/Discord-compatíveis
      text: `*${payload.title}*\n${payload.message}`,
      recipients: users.map((u) => ({ id: u.id, name: u.name })),
      sentAt: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(5000),
  });
}

/**
 * Cria a notificação "in-app" para cada usuário e dispara os canais
 * opcionais (e-mail e webhook). Nunca lança erro: uma falha de notificação
 * não deve derrubar a operação de negócio que a originou.
 *
 * É aguardada (await) antes da resposta HTTP porque em ambiente serverless
 * o processo pode ser congelado logo após a resposta ser enviada.
 */
export async function notifyUsers(userIds: string[], payload: NotificationPayload): Promise<void> {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return;

  try {
    const users = await AppDataSource.getRepository(User).find({ where: { id: In(ids), active: true } });
    if (users.length === 0) return;

    const repo = AppDataSource.getRepository(Notification);
    await repo.save(
      users.map((u) =>
        repo.create({
          userId: u.id,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: payload.data ?? null,
        }),
      ),
    );

    const results = await Promise.allSettled([sendEmails(users, payload), sendWebhook(users, payload)]);
    for (const r of results) {
      if (r.status === 'rejected') console.error('[notificações] falha em canal externo:', r.reason);
    }
  } catch (err) {
    console.error('[notificações] falha ao notificar:', err);
  }
}

/** Notifica todos os usuários ativos dos perfis informados. */
export async function notifyRoles(
  roles: UserRole[],
  payload: NotificationPayload,
  options: { exclude?: string[] } = {},
): Promise<void> {
  try {
    const users = await AppDataSource.getRepository(User).find({
      select: { id: true },
      where: { role: In(roles), active: true },
    });
    const exclude = new Set(options.exclude ?? []);
    await notifyUsers(
      users.map((u) => u.id).filter((id) => !exclude.has(id)),
      payload,
    );
  } catch (err) {
    console.error('[notificações] falha ao notificar perfis:', err);
  }
}
