import { z } from 'zod';
import { env } from '../config/env';

/** Texto opcional: aceita null e trata string vazia como null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v));

export const emailField = z.string().trim().toLowerCase().email('E-mail inválido').max(180);

/** E-mail opcional (null ou vazio = sem e-mail). */
export const optionalEmail = z
  .union([emailField, z.literal(''), z.null()])
  .optional()
  .transform((v) => (v === '' ? null : v));

/** CPF/CNPJ: guarda somente os dígitos; vazio vira null. */
export const documentField = z
  .string()
  .trim()
  .max(30)
  .nullable()
  .optional()
  .transform((v) => (v == null ? v : v.replace(/\D/g, '') || null))
  .refine((v) => v == null || v.length === 11 || v.length === 14, 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos)');

/** Valor em reais, com até 2 casas. */
export const money = z
  .number()
  .min(0)
  .max(99_999_999.99)
  .transform((v) => Math.round((v + Number.EPSILON) * 100) / 100);

export const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

/** Data de hoje (AAAA-MM-DD) no fuso da oficina (APP_TIMEZONE). */
export const today = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: env.APP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(),
  );
