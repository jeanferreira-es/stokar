import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { isManager, isStaff } from '@/models/permissions';
import { invoicesService, serviceRequestsService, settingsService } from '@/models/services/api';
import { REQUEST_STATUSES } from '@/models/labels';
import type { Customer, PaymentInput, RequestPriority, RequestStatus, ServiceRequest, ServiceRequestInput } from '@/models/types';
import { useCurrentUser } from './AuthController';
import { keys, useAction, useAssigneeOptions, useDebounced } from './shared';
import { useInvoiceActions } from './useWorkshopController';

const invalidate = [keys.requests, keys.reports, keys.movements, keys.products, keys.invoices];

/* ---------- Lista ---------- */
export function useServiceRequestsController() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [params] = useSearchParams();
  // A tela do cliente abre o formulário já com ele escolhido
  const initialCustomer = (useLocation().state as { customer?: Pick<Customer, 'id' | 'name' | 'tradeName' | 'document'> } | null)
    ?.customer;
  // O painel abre esta tela já filtrada (?status=OPEN) ou com o formulário aberto (?nova=1)
  const initialStatus = REQUEST_STATUSES.find((s) => s === params.get('status')) ?? 'ALL';
  const [status, setStatus] = useState<RequestStatus | 'ALL'>(initialStatus);
  const [priority, setPriority] = useState<RequestPriority | ''>('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [payment, setPayment] = useState<'' | 'pending' | 'paid'>(params.get('pagamento') === 'pendente' ? 'pending' : '');
  const [creating, setCreating] = useState(params.get('nova') === '1');

  const term = useDebounced(search);
  const filters = {
    page,
    limit: 12,
    search: term,
    status: status === 'ALL' ? undefined : status,
    priority: priority || undefined,
    assigneeId: onlyMine ? user.id : undefined,
    payment: payment || undefined,
  };

  const list = useQuery({
    queryKey: [...keys.requests, 'list', filters],
    queryFn: () => serviceRequestsService.list(filters),
    placeholderData: keepPreviousData,
  });

  const create = useAction((input: ServiceRequestInput) => serviceRequestsService.create(input), {
    invalidate,
    success: (r) => `Solicitação ${r.code} aberta`,
    onSuccess: (r) => {
      setCreating(false);
      navigate(`/solicitacoes/${r.id}`);
    },
  });

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return {
    staff: isStaff(user),
    rows: list.data?.items,
    meta: list.data?.meta,
    loading: list.isLoading,
    hasFilters: !!term || status !== 'ALL' || !!priority || onlyMine || !!payment,
    payment,
    setPayment: resetPage(setPayment),
    search,
    setSearch: resetPage(setSearch),
    status,
    setStatus: resetPage(setStatus),
    priority,
    setPriority: resetPage(setPriority),
    onlyMine,
    setOnlyMine: resetPage(setOnlyMine),
    setPage,
    open: (request: ServiceRequest) => navigate(`/solicitacoes/${request.id}`),
    creating,
    initialCustomer,
    openCreate: () => setCreating(true),
    closeCreate: () => setCreating(false),
    create: (input: ServiceRequestInput) => create.mutate(input),
    creatingBusy: create.isPending,
  };
}

/* ---------- Detalhe e fluxo de atendimento ---------- */
export type RequestDialog = 'edit' | 'approve' | 'reject' | 'assign' | 'complete' | 'cancel' | 'invoice' | 'payment' | null;

export function useServiceRequestDetailController(id: string) {
  const user = useCurrentUser();
  const [dialog, setDialog] = useState<RequestDialog>(null);

  const detail = useQuery({
    queryKey: [...keys.requests, 'detail', id],
    queryFn: () => serviceRequestsService.detail(id),
  });
  const request = detail.data;

  const manager = isManager(user);
  const staff = isStaff(user);
  const owner = request?.requesterId === user.id;
  const status = request?.status;

  // Mesmas regras de status/perfil aplicadas pela API em service-requests.routes.ts
  const inFlow = status === 'OPEN' || status === 'APPROVED' || status === 'IN_PROGRESS';
  const can = {
    // A equipe ajusta serviços, peças e valores até a conclusão; o dono, só enquanto aberta
    edit: (staff && inFlow) || (status === 'OPEN' && owner),
    approve: status === 'OPEN' && manager,
    reject: status === 'OPEN' && manager,
    assign: manager && (status === 'OPEN' || status === 'APPROVED' || status === 'IN_PROGRESS'),
    start: status === 'APPROVED' && staff,
    complete: status === 'IN_PROGRESS' && staff,
    cancel: (status === 'OPEN' || status === 'APPROVED') && (owner || manager),
    invoice: status === 'COMPLETED' && staff && !!request && !request.invoice,
    // Pagamento: a equipe registra quando há valor a receber; pode desfazer se lançou por engano
    payment: staff && request?.payment.status === 'PENDING',
    undoPayment: staff && request?.payment.status === 'PAID',
  };

  // Regra da oficina (Configurações): só conclui depois do pagamento
  const company = useQuery({
    queryKey: [...keys.settings, 'company'],
    queryFn: () => settingsService.company(),
    enabled: staff,
    staleTime: 60_000,
  });
  const paymentBlocksCompletion =
    !!company.data?.requirePaymentToComplete && request?.payment.status === 'PENDING';

  const assignees = useAssigneeOptions(manager);

  const options = (success: string) => ({ invalidate, success, onSuccess: () => setDialog(null) });
  const update = useAction(
    (input: Partial<ServiceRequestInput>) => serviceRequestsService.update(id, input),
    options('Solicitação atualizada'),
  );
  const approve = useAction(
    (assigneeId?: string) => serviceRequestsService.approve(id, { assigneeId: assigneeId || undefined }),
    options('Solicitação aprovada'),
  );
  const reject = useAction(
    (reason: string) => serviceRequestsService.reject(id, { reason }),
    options('Solicitação rejeitada'),
  );
  const assign = useAction(
    (assigneeId: string) => serviceRequestsService.assign(id, { assigneeId }),
    options('Responsável definido'),
  );
  const start = useAction(() => serviceRequestsService.start(id), options('Atendimento iniciado'));
  const complete = useAction(
    (resolutionNotes?: string) => serviceRequestsService.complete(id, { resolutionNotes: resolutionNotes || undefined }),
    options('Solicitação concluída e materiais baixados do estoque'),
  );
  const cancel = useAction(
    (reason?: string) => serviceRequestsService.cancel(id, { reason: reason || undefined }),
    options('Solicitação cancelada'),
  );

  const issueInvoice = useAction(
    (notes?: string) => invoicesService.issue({ serviceRequestId: id, notes: notes || undefined }),
    { invalidate, success: (invoice) => `Nota ${invoice.code} emitida`, onSuccess: () => setDialog(null) },
  );
  const invoiceActions = useInvoiceActions();

  const registerPayment = useAction(
    (input: PaymentInput) => serviceRequestsService.registerPayment(id, input),
    options('Pagamento registrado'),
  );
  const undoPayment = useAction(() => serviceRequestsService.undoPayment(id), options('Pagamento desfeito'));

  /** Itens sem saldo suficiente impedem a conclusão (a API responde 409). */
  const shortages = (request?.items ?? []).filter((i) => i.product && i.product.available < i.quantity);

  return {
    request,
    loading: detail.isLoading,
    notFound: detail.isError,
    can,
    hasActions: [can.edit, can.approve, can.reject, can.assign, can.start, can.complete, can.cancel].some(Boolean),
    paymentBlocksCompletion,
    registerPayment: (input: PaymentInput) => registerPayment.mutate(input),
    undoPayment: () => undoPayment.mutate(),
    paymentBusy: registerPayment.isPending || undoPayment.isPending,
    shortages,
    assignees: assignees.data ?? [],
    dialog,
    openDialog: setDialog,
    closeDialog: () => setDialog(null),
    update: (input: Partial<ServiceRequestInput>) => update.mutate(input),
    approve: (assigneeId?: string) => approve.mutate(assigneeId),
    reject: (reason: string) => reject.mutate(reason),
    assign: (assigneeId: string) => assign.mutate(assigneeId),
    start: () => start.mutate(),
    complete: (notes?: string) => complete.mutate(notes),
    cancel: (reason?: string) => cancel.mutate(reason),
    issueInvoice: (notes?: string) => issueInvoice.mutate(notes),
    openInvoicePdf: () => request?.invoice && invoiceActions.openPdf(request.invoice),
    openingPdf: !!invoiceActions.opening,
    staff,
    busy:
      issueInvoice.isPending ||
      update.isPending ||
      approve.isPending ||
      reject.isPending ||
      assign.isPending ||
      start.isPending ||
      complete.isPending ||
      cancel.isPending,
  };
}
