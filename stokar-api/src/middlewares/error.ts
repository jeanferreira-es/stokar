import { NextFunction, Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ZodError } from 'zod';
import { isProduction } from '../config/env';
import { HttpError } from '../utils/http';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { status: 404, message: `Rota não encontrada: ${req.method} ${req.path}` } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let status = 500;
  let message = 'Erro interno do servidor';
  let details: unknown;

  if (err instanceof HttpError) {
    status = err.status;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 400;
    message = 'Dados inválidos';
    details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  } else if (err instanceof QueryFailedError) {
    const code = (err.driverError as { code?: string } | undefined)?.code;
    if (code === '23505') {
      status = 409;
      message = 'Já existe um registro com estes dados';
    } else if (code === '23503') {
      status = 409;
      message = 'Operação não permitida: o registro está vinculado a outros dados';
    } else if (code === '22P02') {
      status = 400;
      message = 'Valor em formato inválido';
    }
  } else if (err instanceof SyntaxError && 'body' in err) {
    status = 400;
    message = 'JSON inválido no corpo da requisição';
  }

  if (status >= 500) console.error(err);

  res.status(status).json({
    error: {
      status,
      message,
      ...(details !== undefined ? { details } : {}),
      ...(status >= 500 && !isProduction && err instanceof Error ? { debug: err.message } : {}),
    },
  });
}
