import * as SecureStore from 'expo-secure-store';
import type { AuthTokens, User } from '../types';

/**
 * Guarda os tokens da sessão.
 * - access token: só em memória (dura 15 minutos);
 * - refresh token: no armazenamento seguro do aparelho (Keychain no iOS, Keystore no Android).
 */
const REFRESH_KEY = 'stokar.refreshToken';
/** Último perfil carregado: abre o app logado mesmo sem internet (ou com a API acordando). */
const USER_KEY = 'stokar.user';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokenStorage = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,

  /** Lê o refresh token salvo ao abrir o app. */
  async restore(): Promise<string | null> {
    try {
      refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    } catch {
      refreshToken = null;
    }
    return refreshToken;
  },

  async setTokens(tokens: AuthTokens): Promise<void> {
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
    try {
      await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
    } catch {
      /* sem armazenamento seguro, a sessão vale só enquanto o app estiver aberto */
    }
  },

  async saveUser(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch {
      /* sem cópia local: na próxima abertura sem internet, o app espera a conexão */
    }
  },

  async restoreUser(): Promise<User | null> {
    try {
      const saved = await SecureStore.getItemAsync(USER_KEY);
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    accessToken = null;
    refreshToken = null;
    try {
      await Promise.all([SecureStore.deleteItemAsync(REFRESH_KEY), SecureStore.deleteItemAsync(USER_KEY)]);
    } catch {
      /* nada a limpar */
    }
  },
};
