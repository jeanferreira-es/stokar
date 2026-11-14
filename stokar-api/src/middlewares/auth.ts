import { NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../database/data-source';
import { User, UserRole } from '../entities';
import { forbidden, unauthorized } from '../utils/http';
import { verifyToken } from '../utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
      /** A sessão foi aberta pelo aplicativo (tokens de longa duração) */
      appSession?: boolean;
    }
  }
}

/** Exige um access token JWT válido em `Authorization: Bearer <token>`. */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) throw unauthorized('Token de acesso não informado');

  const payload = verifyToken(header.slice(7).trim(), 'access');

  const user = await AppDataSource.getRepository(User)
    .createQueryBuilder('u')
    .addSelect('u.tokenVersion')
    .where('u.id = :id', { id: payload.sub })
    .getOne();

  if (!user || !user.active) throw unauthorized('Usuário inexistente ou desativado');
  if (user.tokenVersion !== payload.tv) throw unauthorized('Sessão encerrada. Faça login novamente');

  req.user = user;
  req.appSession = !!payload.app;
  next();
}

/** Restringe a rota aos perfis informados. Use depois de `authenticate`. */
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw unauthorized();
    if (!roles.includes(req.user.role)) throw forbidden();
    next();
  };
}

/** Atalho para obter o usuário autenticado dentro dos handlers. */
export function currentUser(req: Request): User {
  if (!req.user) throw unauthorized();
  return req.user;
}
