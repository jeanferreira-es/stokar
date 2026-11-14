import type { AuthTokens } from '../types';

const REFRESH_KEY = 'stokar.refreshToken';

/**
 * Guarda os tokens da sessão.
 * - access token: só em memória (some ao fechar a aba, não fica exposto no storage)
 * - refresh token: localStorage, para restaurar a sessão ao recarregar a página
 */
let accessToken: string | null = null;
const listeners = new Set<(tokens: AuthTokens | null) => void>();

function readRefresh(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

/** Lê a expiração (exp) de um JWT, em milissegundos. */
export function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export const tokenStorage = {
  getAccessToken: () => accessToken,
  getRefreshToken: readRefresh,

  setTokens(tokens: AuthTokens) {
    accessToken = tokens.accessToken;
    try {
      localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    } catch {
      /* storage indisponível: a sessão vale só para esta aba */
    }
    listeners.forEach((fn) => fn(tokens));
  },

  clear() {
    accessToken = null;
    try {
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* nada a limpar */
    }
    listeners.forEach((fn) => fn(null));
  },

  subscribe(fn: (tokens: AuthTokens | null) => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  /** Avisa quando outra aba encerra a sessão. */
  onExternalLogout(fn: () => void) {
    const handler = (e: StorageEvent) => {
      if (e.key === REFRESH_KEY && e.newValue === null) {
        accessToken = null;
        fn();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  },
};
