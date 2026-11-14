import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AuthTokens } from '../types';
import { tokenExpiresAt, tokenStorage } from './tokenStorage';

export const API_URL = String(import.meta.env.API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');

/** Erro normalizado a partir do formato `{ error: { status, message, details } }` da API. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { error?: { message?: string; details?: unknown } } | undefined;
    if (error.response) {
      return new ApiError(
        error.response.status,
        body?.error?.message ?? 'Não foi possível concluir a operação',
        body?.error?.details,
      );
    }
    return new ApiError(0, 'Sem conexão com o servidor. Verifique sua rede e tente de novo');
  }
  return new ApiError(0, error instanceof Error ? error.message : 'Erro inesperado');
}

export const errorMessage = (error: unknown) => toApiError(error).message;

export const http = axios.create({ baseURL: API_URL, timeout: 20_000 });

let onSessionExpired: () => void = () => {};
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

/* ---------- Access token em toda requisição ---------- */
http.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ---------- Renovação (refresh token) ---------- */
let refreshing: Promise<string> | null = null;

/**
 * Troca o refresh token por um novo par de tokens.
 * Chamadas simultâneas compartilham a mesma promessa (uma única ida à API).
 */
export function refreshSession(): Promise<string> {
  if (refreshing) return refreshing;

  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return Promise.reject(new ApiError(401, 'Sessão expirada'));

  refreshing = axios
    .post<AuthTokens>(`${API_URL}/auth/refresh`, { refreshToken }, { timeout: 20_000 })
    .then(({ data }) => {
      tokenStorage.setTokens(data);
      return data.accessToken;
    })
    .catch((error: unknown) => {
      throw toApiError(error);
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

/* Renova um pouco antes de o access token vencer, para o usuário não ver 401. */
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
tokenStorage.subscribe((tokens) => {
  clearTimeout(refreshTimer);
  if (!tokens) return;
  const expiresAt = tokenExpiresAt(tokens.accessToken);
  if (!expiresAt) return;
  const delay = Math.max(expiresAt - Date.now() - 60_000, 5_000);
  refreshTimer = setTimeout(() => {
    refreshSession().catch(() => {
      /* se falhar aqui, o interceptor de resposta trata no próximo 401 */
    });
  }, delay);
});

const PUBLIC_AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/refresh'];
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/* ---------- 401: renova e repete a requisição uma vez ---------- */
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isPublic = PUBLIC_AUTH_ROUTES.some((route) => original?.url?.startsWith(route));

    if (error.response?.status === 401 && original && !original._retried && !isPublic) {
      original._retried = true;
      try {
        const token = await refreshSession();
        original.headers.Authorization = `Bearer ${token}`;
        return await http(original);
      } catch (refreshError) {
        const apiError = toApiError(refreshError);
        // Só encerra a sessão se a API recusou o token; falha de rede não desloga.
        if (apiError.status >= 400 && apiError.status < 500) {
          tokenStorage.clear();
          onSessionExpired();
        }
        throw apiError;
      }
    }
    throw toApiError(error);
  },
);

/** Remove chaves vazias antes de montar a query string. */
export function cleanParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as Partial<T>;
}
