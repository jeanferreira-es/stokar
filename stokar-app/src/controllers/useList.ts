import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { useToast } from '@/contexts/ToastContext';

/**
 * Carrega uma lista simples da API com os estados que toda tela precisa:
 * carregando, "puxar para atualizar" e erro em aviso.
 */
export function useList<T>(fetcher: () => Promise<T[]>, deps: DependencyList = []) {
  const toast = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetch = useCallback(fetcher, deps);

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      try {
        setItems(await fetch());
      } catch (error) {
        toast.error(error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetch, toast],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { items, setItems, loading, refreshing, refresh: () => void load(true), reload: () => load() };
}
