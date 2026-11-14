import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService, type RegisterClientInput } from '@/models/services/api';
import { ApiError, refreshSession, setSessionExpiredHandler } from '@/models/services/http';
import { tokenStorage } from '@/models/services/tokenStorage';
import type { User } from '@/models/types';

type Status = 'loading' | 'guest' | 'authenticated';

interface AuthContextValue {
  status: Status;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  registerClient: (input: RegisterClientInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: { name?: string; phone?: string | null; emailNotifications?: boolean }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Sessão do usuário, compartilhada com todo o app. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);

  const signOutLocally = useCallback(() => {
    setUser(null);
    setStatus('guest');
  }, []);

  // Ao abrir o app: tenta retomar a sessão com o refresh token guardado no aparelho
  useEffect(() => {
    setSessionExpiredHandler(signOutLocally);
    let active = true;
    (async () => {
      const saved = await tokenStorage.restore();
      if (!saved) return active && setStatus('guest');
      try {
        await refreshSession();
        const me = await authService.me();
        if (!active) return;
        setUser(me);
        setStatus('authenticated');
      } catch (error) {
        if (!active) return;
        // Token recusado: sessão encerrada. Falha de rede: mantém o token para tentar depois.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) await tokenStorage.clear();
        setStatus('guest');
      }
    })();
    return () => {
      active = false;
    };
  }, [signOutLocally]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login: async (email, password) => {
        const session = await authService.login({ email: email.trim(), password });
        await tokenStorage.setTokens(session);
        setUser(session.user);
        setStatus('authenticated');
      },
      registerClient: async (input) => {
        const session = await authService.registerClient(input);
        await tokenStorage.setTokens(session);
        setUser(session.user);
        setStatus('authenticated');
      },
      logout: async () => {
        try {
          await authService.logout();
        } catch {
          /* sem rede: encerra a sessão só neste aparelho */
        }
        await tokenStorage.clear();
        signOutLocally();
      },
      updateProfile: async (input) => {
        setUser(await authService.updateMe(input));
      },
      changePassword: async (currentPassword, newPassword) => {
        await tokenStorage.setTokens(await authService.changePassword({ currentPassword, newPassword }));
      },
      deleteAccount: async (password) => {
        await authService.deleteAccount(password);
        await tokenStorage.clear();
        signOutLocally();
      },
    }),
    [status, user, signOutLocally],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return context;
}

/** Usuário autenticado (para telas que só existem com sessão). */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('Esta tela exige um usuário autenticado');
  return user;
}
