import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService, type RegisterClientInput } from '@/models/services/api';
import { ApiError, refreshSession, setSessionExpiredHandler } from '@/models/services/http';
import { recentAccounts } from '@/models/services/recentAccounts';
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

/** Token recusado pela API (sessão encerrada de verdade); falha de rede ou servidor fora do ar não conta. */
const isRejected = (error: unknown) => error instanceof ApiError && error.status >= 400 && error.status < 500;

/**
 * Sessão do usuário, compartilhada com todo o app.
 * A sessão só termina ao tocar em "Sair", ao trocar a senha em outro aparelho ou após meses sem uso:
 * sem internet (ou com a API acordando), o app abre com o último perfil salvo e tenta de novo depois.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);

  const signOutLocally = useCallback(() => {
    setUser(null);
    setStatus('guest');
  }, []);

  /** Entrou (login ou cadastro): guarda o perfil e o atalho de e-mail da tela de login. */
  const startSession = useCallback(async (next: User) => {
    setUser(next);
    setStatus('authenticated');
    await Promise.all([tokenStorage.saveUser(next), recentAccounts.remember({ email: next.email, name: next.name })]);
  }, []);

  // Ao abrir o app: tenta retomar a sessão com o refresh token guardado no aparelho
  useEffect(() => {
    setSessionExpiredHandler(signOutLocally);
    let active = true;
    (async () => {
      const saved = await tokenStorage.restore();
      if (!saved) return active && setStatus('guest');
      const cached = await tokenStorage.restoreUser();
      // Com o perfil salvo, abre direto; a sessão é confirmada com a API em segundo plano
      if (cached && active) {
        setUser(cached);
        setStatus('authenticated');
      }
      try {
        await refreshSession();
        const me = await authService.me();
        if (!active) return;
        setUser(me);
        setStatus('authenticated');
        void tokenStorage.saveUser(me);
      } catch (error) {
        if (!active) return;
        if (isRejected(error)) {
          // A API recusou o token (senha trocada, conta desativada, meses sem uso): sessão encerrada
          await tokenStorage.clear();
          signOutLocally();
        } else if (!cached) {
          // Sem internet e sem perfil salvo: mantém o token e volta para o login só nesta abertura
          setStatus('guest');
        }
        // Com perfil salvo e falha de rede: continua logado; as telas tentam de novo quando a conexão voltar
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
        await startSession(session.user);
      },
      registerClient: async (input) => {
        const session = await authService.registerClient(input);
        await tokenStorage.setTokens(session);
        await startSession(session.user);
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
        const updated = await authService.updateMe(input);
        setUser(updated);
        void tokenStorage.saveUser(updated);
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
    [status, user, signOutLocally, startSession],
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
