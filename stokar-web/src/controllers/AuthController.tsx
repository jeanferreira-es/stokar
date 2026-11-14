import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { authService } from '@/models/services/api';
import { ApiError, refreshSession, setSessionExpiredHandler } from '@/models/services/http';
import { tokenStorage } from '@/models/services/tokenStorage';
import type { AuthSession, User } from '@/models/types';
import { queryClient } from './shared';

type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthController {
  status: AuthStatus;
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; emailNotifications?: boolean }) => Promise<void>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
}

const AuthContext = createContext<AuthController | null>(null);

export function AuthController({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const booted = useRef(false);

  const endSession = useCallback(() => {
    setUser(null);
    setStatus('guest');
    queryClient.clear();
  }, []);

  const startSession = useCallback((session: AuthSession) => {
    tokenStorage.setTokens(session);
    queryClient.clear();
    setUser(session.user);
    setStatus('authenticated');
  }, []);

  /* Restaura a sessão a partir do refresh token ao abrir o app */
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    if (!tokenStorage.getRefreshToken()) {
      setStatus('guest');
      return;
    }
    refreshSession()
      .then(() => authService.me())
      .then((me) => {
        setUser(me);
        setStatus('authenticated');
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) tokenStorage.clear();
        setStatus('guest');
      });
  }, []);

  /* Sessão recusada pela API (token revogado, usuário desativado...) ou encerrada em outra aba */
  useEffect(() => {
    setSessionExpiredHandler(() => {
      endSession();
      toast.info('Sua sessão expirou. Entre de novo para continuar.');
    });
    return tokenStorage.onExternalLogout(endSession);
  }, [endSession]);

  const value = useMemo<AuthController>(
    () => ({
      status,
      user,
      login: async (credentials) => startSession(await authService.login(credentials)),
      register: async (data) => startSession(await authService.register(data)),
      logout: async () => {
        // O logout na API invalida todos os tokens do usuário; se falhar, a sessão local sai mesmo assim.
        await authService.logout().catch(() => undefined);
        tokenStorage.clear();
        endSession();
      },
      updateProfile: async (data) => setUser(await authService.updateMe(data)),
      changePassword: async (data) => {
        // A API encerra as outras sessões e devolve um novo par de tokens para esta.
        tokenStorage.setTokens(await authService.changePassword(data));
      },
    }),
    [status, user, startSession, endSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthController>');
  return ctx;
}

/** Atalho para telas protegidas, onde o usuário sempre existe. */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('Tela protegida renderizada sem usuário autenticado');
  return user;
}
