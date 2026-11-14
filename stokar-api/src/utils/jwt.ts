import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../entities';
import { unauthorized } from './http';

export interface TokenPayload {
  sub: string;
  role: string;
  /** tokenVersion do usuário no momento da emissão */
  tv: number;
  type: 'access' | 'refresh';
  /** Sessão do aplicativo: o refresh token dura mais (JWT_APP_REFRESH_EXPIRES_IN) */
  app?: boolean;
}

export interface IssueOptions {
  /** true para o aplicativo: a sessão só termina ao tocar em "Sair" (ou após muito tempo sem uso) */
  app?: boolean;
}

function sign(user: Pick<User, 'id' | 'role' | 'tokenVersion'>, type: TokenPayload['type'], app: boolean): string {
  const secret = type === 'access' ? env.JWT_SECRET : env.JWT_REFRESH_SECRET;
  const refreshTtl = app ? env.JWT_APP_REFRESH_EXPIRES_IN : env.JWT_REFRESH_EXPIRES_IN;
  const expiresIn = (type === 'access' ? env.JWT_EXPIRES_IN : refreshTtl) as SignOptions['expiresIn'];
  return jwt.sign({ role: user.role, tv: user.tokenVersion, type, ...(app ? { app: true } : {}) }, secret, {
    subject: user.id,
    expiresIn,
    algorithm: 'HS256',
  });
}

/**
 * Novo par de tokens. A cada renovação o refresh token é reemitido com validade cheia,
 * então quem usa o sistema com frequência não precisa entrar de novo.
 */
export function issueTokens(user: Pick<User, 'id' | 'role' | 'tokenVersion'>, options: IssueOptions = {}) {
  const app = !!options.app;
  return {
    tokenType: 'Bearer',
    accessToken: sign(user, 'access', app),
    refreshToken: sign(user, 'refresh', app),
    expiresIn: env.JWT_EXPIRES_IN,
  };
}

export function verifyToken(token: string, type: TokenPayload['type']): TokenPayload {
  const secret = type === 'access' ? env.JWT_SECRET : env.JWT_REFRESH_SECRET;
  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] }) as unknown as TokenPayload;
    if (payload.type !== type || !payload.sub) throw new Error('tipo de token inválido');
    return payload;
  } catch {
    throw unauthorized('Token inválido ou expirado');
  }
}
