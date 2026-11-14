import 'dotenv/config';
import { z } from 'zod';

const bool = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : ['true', '1', 'yes'].includes(v.toLowerCase())));

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().default(3000),
  CORS_ORIGIN: z.string().default('*'),
  /** Fuso usado nas datas das notas e na vigência dos contratos */
  APP_TIMEZONE: z.string().default('America/Sao_Paulo'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  DB_SSL: bool(false),
  DB_MIGRATIONS_RUN: bool(true),
  DB_SYNCHRONIZE: bool(false),
  DB_POOL_MAX: z.coerce.number().int().min(1).default(3),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET deve ter ao menos 16 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET deve ter ao menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  /** Validade do refresh token do aplicativo (renovada a cada uso) */
  JWT_APP_REFRESH_EXPIRES_IN: z.string().default('180d'),

  ALLOW_PUBLIC_REGISTRATION: bool(true),
  ALLOW_CLIENT_REGISTRATION: bool(true),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: bool(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('Estoque <no-reply@localhost>'),
  NOTIFICATION_WEBHOOK_URL: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `- ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Variáveis de ambiente inválidas:\n${details}`);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
