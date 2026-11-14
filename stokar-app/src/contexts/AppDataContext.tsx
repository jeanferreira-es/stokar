import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { isClient, isStaff } from '@/models/permissions';
import { chatService, customersService, notificationsService, requestsService, settingsService } from '@/models/services/api';
import type { AppNotification, CompanySettings, CustomerProfile, PendingPayments } from '@/models/types';
import { useAuth } from './AuthContext';

/** Intervalo de consulta dos contadores (a API não tem push nem WebSocket). */
const POLL_MS = Number(process.env.EXPO_PUBLIC_UNREAD_POLL_MS) || 20_000;
const NEWS_LIMIT = 3;

interface AppDataContextValue {
  /** Dados da oficina (nome, telefone, endereço) */
  company: CompanySettings | null;
  /** Cadastro do cliente com veículos e contratos (só no perfil CLIENT) */
  profile: CustomerProfile | null;
  reloadProfile: () => Promise<void>;
  setProfile: (profile: CustomerProfile) => void;
  unreadChat: number;
  unreadNotifications: number;
  /** As notificações não lidas mais recentes: viram as "Novidades" da tela inicial */
  news: AppNotification[];
  /** Marca como lida e tira das novidades na hora (sem esperar a próxima consulta) */
  markNotificationRead: (id: string) => void;
  refreshUnread: () => void;
  /** Cliente: serviços com valor ainda não pago e a chave PIX da oficina */
  payments: PendingPayments | null;
  refreshPayments: () => void;
  /** Muda a cada serviço criado/alterado: as listas observam este número para recarregar */
  requestsVersion: number;
  touchRequests: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

/**
 * Dados globais da sessão, compartilhados entre as telas:
 * oficina, cadastro do cliente, contadores de não lidas e a "versão" das listas de serviços.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [unreadChat, setUnreadChat] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [news, setNews] = useState<AppNotification[]>([]);
  const [requestsVersion, setRequestsVersion] = useState(0);
  const [payments, setPayments] = useState<PendingPayments | null>(null);
  const userRef = useRef(user);
  userRef.current = user;

  const reloadProfile = useCallback(async () => {
    if (!isClient(userRef.current)) return;
    setProfile(await customersService.me());
  }, []);

  const refreshPayments = useCallback(() => {
    if (!isClient(userRef.current)) return;
    requestsService
      .pendingPayments()
      .then(setPayments)
      .catch(() => {});
  }, []);

  const refreshUnread = useCallback(() => {
    const current = userRef.current;
    if (!current || (!isClient(current) && !isStaff(current))) return;
    chatService.unreadCount().then(setUnreadChat).catch(() => {});
    // Uma chamada traz o contador e as últimas não lidas
    notificationsService
      .list({ unread: true, limit: NEWS_LIMIT })
      .then((result) => {
        setUnreadNotifications(result.unreadCount);
        setNews(result.items);
      })
      .catch(() => {});
  }, []);

  const markNotificationRead = useCallback(
    (id: string) => {
      setNews((list) => {
        if (list.some((n) => n.id === id)) setUnreadNotifications((count) => Math.max(count - 1, 0));
        return list.filter((n) => n.id !== id);
      });
      notificationsService.markRead(id).then(refreshUnread).catch(() => {});
    },
    [refreshUnread],
  );

  // Carrega ao entrar e limpa ao sair
  useEffect(() => {
    if (!user) {
      setCompany(null);
      setProfile(null);
      setUnreadChat(0);
      setUnreadNotifications(0);
      setNews([]);
      setPayments(null);
      return;
    }
    settingsService.company().then(setCompany).catch(() => {});
    reloadProfile().catch(() => {});
    refreshUnread();
    refreshPayments();

    const timer = setInterval(() => {
      if (AppState.currentState === 'active') refreshUnread();
    }, POLL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      refreshUnread();
      refreshPayments();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [user?.id, reloadProfile, refreshUnread, refreshPayments]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chegou notificação (ex.: pagamento confirmado, serviço aprovado) ou um serviço mudou: confere as pendências
  useEffect(() => {
    if (user) refreshPayments();
  }, [unreadNotifications, requestsVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({
      company,
      profile,
      reloadProfile,
      setProfile,
      unreadChat,
      unreadNotifications,
      news,
      markNotificationRead,
      refreshUnread,
      payments,
      refreshPayments,
      requestsVersion,
      touchRequests: () => setRequestsVersion((v) => v + 1),
    }),
    [
      company,
      profile,
      reloadProfile,
      unreadChat,
      unreadNotifications,
      news,
      markNotificationRead,
      refreshUnread,
      payments,
      refreshPayments,
      requestsVersion,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData precisa estar dentro de <AppDataProvider>');
  return context;
}
