import { useCallback, useEffect, useState } from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import { useCurrentUser } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { isManager, isStaff } from '@/models/permissions';
import { invoicesService, requestsService } from '@/models/services/api';
import { openInvoicePdf } from '@/models/services/invoicePdf';
import type { PaymentMethod, ServiceRequest } from '@/models/types';

export type RequestAction = 'approve' | 'reject' | 'start' | 'complete' | 'cancel' | 'invoice';

/** Detalhe do serviço e o fluxo de atendimento (mesmas regras da API e do site). */
export function useRequestDetailController(id: string) {
  const user = useCurrentUser();
  const toast = useToast();
  const { touchRequests, company, refreshPayments } = useAppData();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState<RequestAction | 'pdf' | 'payment' | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      try {
        setRequest(await requestsService.detail(id));
        setNotFound(false);
      } catch (error) {
        setNotFound(true);
        if (refresh) toast.error(error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, toast],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const staff = isStaff(user);
  const manager = isManager(user);
  const status = request?.status;
  const owner = !!request && (request.requesterId === user.id || (!!user.customerId && request.customerId === user.customerId));

  const can: Record<RequestAction, boolean> = {
    approve: status === 'OPEN' && manager,
    reject: status === 'OPEN' && manager,
    start: status === 'APPROVED' && staff,
    complete: status === 'IN_PROGRESS' && staff,
    cancel: (status === 'OPEN' || status === 'APPROVED') && (owner || manager),
    invoice: status === 'COMPLETED' && staff && !!request && !request.invoice,
  };

  const SUCCESS: Record<RequestAction, string> = {
    approve: 'Serviço aprovado',
    reject: 'Serviço rejeitado',
    start: 'Atendimento iniciado',
    complete: 'Serviço concluído',
    cancel: 'Pedido cancelado',
    invoice: 'Nota emitida',
  };

  /** Executa uma ação do fluxo. `text` é o motivo (rejeitar/cancelar) ou as notas da conclusão. */
  const run = async (action: RequestAction, text?: string): Promise<boolean> => {
    setBusy(action);
    try {
      const note = text?.trim() || undefined;
      if (action === 'approve') await requestsService.approve(id);
      if (action === 'reject') await requestsService.reject(id, { reason: note ?? '' });
      if (action === 'start') await requestsService.start(id);
      if (action === 'complete') await requestsService.complete(id, { resolutionNotes: note });
      if (action === 'cancel') await requestsService.cancel(id, { reason: note });
      if (action === 'invoice') await invoicesService.issue(id);
      setRequest(await requestsService.detail(id));
      touchRequests();
      toast.success(SUCCESS[action]);
      return true;
    } catch (error) {
      toast.error(error);
      return false;
    } finally {
      setBusy(null);
    }
  };

  /** Equipe: registra que o cliente pagou (o cliente é avisado). */
  const registerPayment = async (method: PaymentMethod, notes?: string): Promise<boolean> => {
    setBusy('payment');
    try {
      setRequest(await requestsService.registerPayment(id, { method, notes: notes?.trim() || undefined }));
      setRequest(await requestsService.detail(id));
      touchRequests();
      refreshPayments();
      toast.success('Pagamento registrado');
      return true;
    } catch (error) {
      toast.error(error);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const openPdf = async () => {
    if (!request?.invoice) return;
    setBusy('pdf');
    try {
      await openInvoicePdf(request.invoice);
    } catch (error) {
      toast.error(error);
    } finally {
      setBusy(null);
    }
  };

  const payment = request?.payment;
  // Regra da oficina (Configurações no site): só conclui depois do pagamento
  const paymentBlocksCompletion = !!company?.requirePaymentToComplete && payment?.status === 'PENDING';

  return {
    request,
    loading,
    refreshing,
    notFound,
    refresh: () => void load(true),
    staff,
    can: { ...can, complete: can.complete && !paymentBlocksCompletion },
    paymentBlocksCompletion: can.complete && paymentBlocksCompletion,
    canRegisterPayment: staff && payment?.status === 'PENDING',
    registerPayment,
    run,
    busy,
    openPdf,
  };
}
