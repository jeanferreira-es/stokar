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
}

function sign(user: Pick<User, 'id' | 'role' | 'tokenVersion'>, type: TokenPayload['type']): string {
  const secret = type === 'access' ? env.JWT_SECRET : env.JWT_REFRESH_SECRET;
  const expiresIn = (type === 'access' ? env.JWT_EXPIRES_IN : env.JWT_REFRESH_EXPIRES_IN) as SignOptions['expiresIn'];
  return jwt.sign({ role: user.role, tv: user.tokenVersion, type }, secret, {
    subject: user.id,
    expiresIn,
    algorithm: 'HS256',
  });
}

export function issueTokens(user: Pick<User, 'id' | 'role' | 'tokenVersion'>) {
  return {
    tokenType: 'Bearer',
    accessToken: sign(user, 'access'),
    refreshToken: sign(user, 'refresh'),
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
