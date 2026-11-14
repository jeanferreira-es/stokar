import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import { useCurrentUser } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { isStaff } from '@/models/permissions';
import { requestsService } from '@/models/services/api';
import type { RequestStatus, ServiceRequest } from '@/models/types';

const PAGE_SIZE = 15;

/** Em aberto = tudo o que ainda não terminou. */
export type StatusFilter = 'ALL' | RequestStatus;

/** Lista de serviços: do cliente (os dele) ou da oficina (todos), com filtro, busca e paginação. */
export function useRequestsController() {
  const user = useCurrentUser();
  const toast = useToast();
  const { requestsVersion, unreadNotifications } = useAppData();
  const staff = isStaff(user);

  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestId = useRef(0);

  // Espera o usuário parar de digitar antes de buscar
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async (targetPage: number, mode: 'initial' | 'refresh' | 'more' | 'silent') => {
      const current = (requestId.current += 1);
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      if (mode === 'more') setLoadingMore(true);
      try {
        const result = await requestsService.list({
          page: targetPage,
          limit: PAGE_SIZE,
          status: status === 'ALL' ? undefined : status,
          search: term || undefined,
        });
        if (current !== requestId.current) return; // chegou uma resposta antiga
        setItems((list) => (targetPage === 1 ? result.items : [...list, ...result.items]));
        setPage(result.meta.page);
        setTotalPages(result.meta.totalPages);
      } catch (error) {
        if (current === requestId.current) toast.error(error);
      } finally {
        if (current === requestId.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [status, term, toast],
  );

  useEffect(() => {
    void load(1, 'initial');
  }, [load, requestsVersion]);

  // Chegou (ou foi lida) uma notificação: algum serviço pode ter mudado de status.
  // Atualiza a lista sem mostrar o indicador de carregamento.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    void load(1, 'silent');
  }, [unreadNotifications]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    staff,
    items,
    loading,
    refreshing,
    loadingMore,
    hasFilters: status !== 'ALL' || !!term,
    status,
    setStatus,
    search,
    setSearch,
    refresh: () => void load(1, 'refresh'),
    loadMore: () => {
      if (!loading && !loadingMore && page < totalPages) void load(page + 1, 'more');
    },
  };
}
