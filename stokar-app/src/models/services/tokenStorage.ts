import * as SecureStore from 'expo-secure-store';
import type { AuthTokens } from '../types';

/**
 * Guarda os tokens da sessão.
 * - access token: só em memória (dura 15 minutos);
 * - refresh token: no armazenamento seguro do aparelho (Keychain no iOS, Keystore no Android).
 */
const REFRESH_KEY = 'stokar.refreshToken';

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

  async clear(): Promise<void> {
    accessToken = null;
    refreshToken = null;
    try {
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    } catch {
      /* nada a limpar */
    }
  },
};
