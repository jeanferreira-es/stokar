import { z } from 'zod';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, details?: unknown) => new HttpError(400, message, details);
export const unauthorized = (message = 'Não autenticado') => new HttpError(401, message);
export const forbidden = (message = 'Você não tem permissão para esta ação') => new HttpError(403, message);
export const notFound = (message = 'Recurso não encontrado') => new HttpError(404, message);
export const conflict = (message: string, details?: unknown) => new HttpError(409, message, details);

const uuidSchema = z.string().uuid('Identificador inválido');
export const parseId = (value: unknown): string => uuidSchema.parse(value);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function paginated<T>(items: T[], total: number, page: number, limit: number) {
  return {
    items,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/** Aceita "true"/"false" em query strings */
export const queryBoolean = z
  .enum(['true', 'false'])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === 'true'));

/** Remove as chaves com valor undefined (campos não enviados em um PATCH). */
export function compact<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}
