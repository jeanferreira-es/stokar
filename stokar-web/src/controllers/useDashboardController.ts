import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { isStaff } from '@/models/permissions';
import { reportsService, serviceRequestsService, stockService } from '@/models/services/api';
import type { RequestStatus, SeriesGranularity } from '@/models/types';
import { useCurrentUser } from './AuthController';
import { keys } from './shared';

const SERIES_POINTS: Record<SeriesGranularity, number> = { day: 14, week: 12, month: 9 };

/** Solicitações que ainda contam para a "taxa de atendimento". */
const ACTIVE: RequestStatus[] = ['OPEN', 'APPROVED', 'IN_PROGRESS'];

export function completionRate(byStatus?: Record<RequestStatus, number>) {
  if (!byStatus) return { rate: 0, completed: 0, pending: 0 };
  const pending = ACTIVE.reduce((sum, s) => sum + (byStatus[s] ?? 0), 0);
  const completed = byStatus.COMPLETED ?? 0;
  const total = pending + completed;
  return { rate: total ? (completed / total) * 100 : 0, completed, pending };
}

export function useDashboardController() {
  const user = useCurrentUser();
  const staff = isStaff(user);
  const [granularity, setGranularity] = useState<SeriesGranularity>('month');

  /* ---- Equipe (ADMIN, MANAGER, OPERATOR) ---- */
  const summary = useQuery({
    queryKey: [...keys.reports, 'summary'],
    queryFn: reportsService.summary,
    enabled: staff,
  });
  const series = useQuery({
    queryKey: [...keys.reports, 'series', granularity],
    queryFn: () => reportsService.movementsSeries({ granularity, points: SERIES_POINTS[granularity] }),
    enabled: staff,
  });
  const topProducts = useQuery({
    queryKey: [...keys.reports, 'top-products'],
    queryFn: () => reportsService.topProducts({ days: 30, limit: 4, type: 'OUT' }),
    enabled: staff,
  });
  const recentMovements = useQuery({
    queryKey: [...keys.movements, 'recent'],
    queryFn: () => stockService.movements({ limit: 5 }).then((r) => r.items),
    enabled: staff,
  });

  /* ---- Solicitante ---- */
  const myRequests = useQuery({
    queryKey: [...keys.reports, 'my-requests'],
    queryFn: reportsService.myRequests,
    enabled: !staff,
  });
  const myRecent = useQuery({
    queryKey: [...keys.requests, 'recent'],
    queryFn: () => serviceRequestsService.list({ limit: 5 }).then((r) => r.items),
    enabled: !staff,
  });

  const requestsByStatus = staff ? summary.data?.serviceRequests : myRequests.data?.byStatus;

  return {
    user,
    staff,
    granularity,
    setGranularity,
    summary: summary.data,
    summaryLoading: summary.isLoading,
    series: series.data?.points,
    seriesLoading: series.isLoading,
    seriesError: series.isError,
    topProducts: topProducts.data,
    topProductsLoading: topProducts.isLoading,
    recentMovements: recentMovements.data,
    recentMovementsLoading: recentMovements.isLoading,
    requestsByStatus,
    requestsLoading: staff ? summary.isLoading : myRequests.isLoading,
    completion: completionRate(requestsByStatus),
    myRecent: myRecent.data,
    myRecentLoading: myRecent.isLoading,
  };
}
