import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isManager, isStaff } from '@/models/permissions';
import {
  contractsService,
  customersService,
  invoicesService,
  servicesService,
  serviceTypesService,
  serviceRequestsService,
  vehiclesService,
  type ServiceTypeInput,
} from '@/models/services/api';
import type {
  Contract,
  ContractInput,
  ContractStatus,
  Customer,
  CustomerInput,
  CustomerType,
  Invoice,
  InvoiceStatus,
  Service,
  ServiceInput,
  ServiceType,
  Vehicle,
  VehicleInput,
} from '@/models/types';
import { openBlob } from '@/utils/format';
import { useCurrentUser } from './AuthController';
import { keys, useAction, useDebounced } from './shared';

/** Estado comum das listas: busca, página, diálogo de edição e confirmação. */
function useListState<T>() {
  const [search, setSearchState] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [removing, setRemoving] = useState<T | null>(null);
  return {
    search,
    term: useDebounced(search),
    setSearch: (value: string) => {
      setSearchState(value);
      setPage(1);
    },
    page,
    setPage,
    editing,
    setEditing,
    removing,
    setRemoving,
  };
}

/* ---------- Clientes ---------- */
export function useCustomersController() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const state = useListState<Customer>();
  const { editing, removing, setEditing, setRemoving } = state;
  const [type, setType] = useState<CustomerType | ''>('');
  const [showInactive, setShowInactive] = useState(false);
  const filters = {
    page: state.page,
    limit: 12,
    search: state.term,
    type: type || undefined,
    active: showInactive ? undefined : true,
  };

  const list = useQuery({
    queryKey: [...keys.customers, 'list', filters],
    queryFn: () => customersService.list(filters),
    placeholderData: keepPreviousData,
  });

  const invalidate = [keys.customers];
  const save = useAction(
    (input: CustomerInput) =>
      editing && editing !== 'new' ? customersService.update(editing.id, input) : customersService.create(input),
    {
      invalidate,
      success: 'Cliente salvo',
      onSuccess: (customer) => {
        const created = editing === 'new';
        setEditing(null);
        if (created) navigate(`/clientes/${customer.id}`);
      },
    },
  );
  const deactivate = useAction((id: string) => customersService.deactivate(id), {
    invalidate,
    success: 'Cliente desativado',
    onSuccess: () => setRemoving(null),
  });
  const reactivate = useAction((id: string) => customersService.update(id, { active: true }), {
    invalidate,
    success: 'Cliente reativado',
  });

  return {
    ...state,
    canRemove: isManager(user),
    rows: list.data?.items,
    meta: list.data?.meta,
    loading: list.isLoading,
    type,
    setType: (value: CustomerType | '') => {
      setType(value);
      state.setPage(1);
    },
    showInactive,
    setShowInactive: (value: boolean) => {
      setShowInactive(value);
      state.setPage(1);
    },
    open: (customer: Customer) => navigate(`/clientes/${customer.id}`),
    save: (input: CustomerInput) => save.mutate(input),
    saving: save.isPending,
    confirmRemove: () => removing && deactivate.mutate(removing.id),
    removingBusy: deactivate.isPending,
    reactivate: (customer: Customer) => reactivate.mutate(customer.id),
  };
}

export type CustomerDialog = 'edit' | 'vehicle' | 'access' | null;

/** Detalhe do cliente: cadastro, veículos, acessos ao aplicativo, contratos e últimos serviços. */
export function useCustomerDetailController(id: string) {
  const user = useCurrentUser();
  const [dialog, setDialog] = useState<CustomerDialog>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const detail = useQuery({
    queryKey: [...keys.customers, 'detail', id],
    queryFn: () => customersService.detail(id),
  });
  const requests = useQuery({
    queryKey: [...keys.requests, 'by-customer', id],
    queryFn: () => serviceRequestsService.list({ customerId: id, limit: 8 }).then((r) => r.items),
  });

  const invalidate = [keys.customers, keys.vehicles, keys.users];
  const close = () => {
    setDialog(null);
    setVehicle(null);
  };
  const update = useAction((input: CustomerInput) => customersService.update(id, input), {
    invalidate,
    success: 'Cliente atualizado',
    onSuccess: close,
  });
  const saveVehicle = useAction(
    (input: VehicleInput) =>
      vehicle ? vehiclesService.update(vehicle.id, input) : vehiclesService.create({ ...input, customerId: id }),
    { invalidate, success: 'Veículo salvo', onSuccess: close },
  );
  const toggleVehicle = useAction((v: Vehicle) => vehiclesService.update(v.id, { active: !v.active }), {
    invalidate,
    success: 'Veículo atualizado',
  });
  const createAccess = useAction(
    (input: { name: string; email: string; password: string }) => customersService.createAccess(id, input),
    { invalidate, success: (u) => `Acesso criado para ${u.name}`, onSuccess: close },
  );

  return {
    customer: detail.data,
    requests: requests.data ?? [],
    loading: detail.isLoading,
    notFound: detail.isError,
    canManage: isManager(user),
    dialog,
    vehicle,
    openDialog: setDialog,
    editVehicle: (v: Vehicle | null) => {
      setVehicle(v);
      setDialog('vehicle');
    },
    closeDialog: close,
    update: (input: CustomerInput) => update.mutate(input),
    saveVehicle: (input: VehicleInput) => saveVehicle.mutate(input),
    toggleVehicle: (v: Vehicle) => toggleVehicle.mutate(v),
    createAccess: (input: { name: string; email: string; password: string }) => createAccess.mutate(input),
    busy: update.isPending || saveVehicle.isPending || createAccess.isPending,
  };
}

/* ---------- Catálogo: serviços e tipos ---------- */
export function useServicesController() {
  const user = useCurrentUser();
  const state = useListState<Service>();
  const { editing, removing, setEditing, setRemoving } = state;
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const filters = {
    page: state.page,
    limit: 12,
    search: state.term,
    serviceTypeId: serviceTypeId || undefined,
    active: showInactive ? undefined : true,
  };

  const list = useQuery({
    queryKey: [...keys.services, 'list', filters],
    queryFn: () => servicesService.list(filters),
    placeholderData: keepPreviousData,
  });

  const invalidate = [keys.services];
  const save = useAction(
    (input: ServiceInput) =>
      editing && editing !== 'new' ? servicesService.update(editing.id, input) : servicesService.create(input),
    { invalidate, success: 'Serviço salvo', onSuccess: () => setEditing(null) },
  );
  const deactivate = useAction((id: string) => servicesService.deactivate(id), {
    invalidate,
    success: 'Serviço desativado',
    onSuccess: () => setRemoving(null),
  });
  const reactivate = useAction((id: string) => servicesService.update(id, { active: true }), {
    invalidate,
    success: 'Serviço reativado',
  });

  return {
    ...state,
    canManage: isManager(user),
    rows: list.data?.items,
    meta: list.data?.meta,
    loading: list.isLoading,
    serviceTypeId,
    setServiceTypeId: (value: string) => {
      setServiceTypeId(value);
      state.setPage(1);
    },
    showInactive,
    setShowInactive: (value: boolean) => {
      setShowInactive(value);
      state.setPage(1);
    },
    save: (input: ServiceInput) => save.mutate(input),
    saving: save.isPending,
    confirmRemove: () => removing && deactivate.mutate(removing.id),
    removingBusy: deactivate.isPending,
    reactivate: (service: Service) => reactivate.mutate(service.id),
  };
}

export function useServiceTypesController() {
  const user = useCurrentUser();
  const state = useListState<ServiceType>();
  const { editing, removing, setEditing, setRemoving } = state;
  const filters = { page: state.page, limit: 50, search: state.term };

  const list = useQuery({
    queryKey: [...keys.serviceTypes, 'list', filters],
    queryFn: () => serviceTypesService.list(filters),
    placeholderData: keepPreviousData,
  });

  const invalidate = [keys.serviceTypes, keys.services];
  const save = useAction(
    (input: ServiceTypeInput) =>
      editing && editing !== 'new' ? serviceTypesService.update(editing.id, input) : serviceTypesService.create(input),
    { invalidate, success: 'Tipo de serviço salvo', onSuccess: () => setEditing(null) },
  );
  const remove = useAction((id: string) => serviceTypesService.remove(id), {
    invalidate,
    success: 'Tipo de serviço excluído',
    onSuccess: () => setRemoving(null),
  });

  return {
    ...state,
    canManage: isManager(user),
    rows: list.data?.items,
    meta: list.data?.meta,
    loading: list.isLoading,
    save: (input: ServiceTypeInput) => save.mutate(input),
    saving: save.isPending,
    confirmRemove: () => removing && remove.mutate(removing.id),
    removingBusy: remove.isPending,
  };
}

/* ---------- Contratos ---------- */
export function useContractsController() {
  const user = useCurrentUser();
  const state = useListState<Contract>();
  const { editing, setEditing } = state;
  const [status, setStatus] = useState<ContractStatus | ''>('');
  const filters = { page: state.page, limit: 12, search: state.term, status: status || undefined };

  const list = useQuery({
    queryKey: [...keys.contracts, 'list', filters],
    queryFn: () => contractsService.list(filters),
    placeholderData: keepPreviousData,
  });

  // A lista não traz a tabela de preços: carrega o contrato completo ao abrir a edição
  const editingId = editing && editing !== 'new' ? editing.id : null;
  const full = useQuery({
    queryKey: [...keys.contracts, 'detail', editingId],
    queryFn: () => contractsService.detail(editingId!),
    enabled: !!editingId,
  });

  const save = useAction(
    ({ customerId, ...rest }: ContractInput) =>
      editingId ? contractsService.update(editingId, rest) : contractsService.create({ customerId, ...rest }),
    { invalidate: [keys.contracts, keys.customers], success: (c) => `Contrato ${c.code} salvo`, onSuccess: () => setEditing(null) },
  );

  return {
    ...state,
    canManage: isManager(user),
    rows: list.data?.items,
    meta: list.data?.meta,
    loading: list.isLoading,
    status,
    setStatus: (value: ContractStatus | '') => {
      setStatus(value);
      state.setPage(1);
    },
    /** Contrato completo para o formulário (undefined enquanto carrega) */
    editingContract: editing === 'new' ? null : full.data,
    formReady: editing === 'new' || (!!editingId && !!full.data),
    save: (input: ContractInput) => save.mutate(input),
    saving: save.isPending,
  };
}

/* ---------- Notas de serviço ---------- */
export function useInvoiceActions() {
  const [opening, setOpening] = useState<string | null>(null);
  const pdf = useAction(
    async (invoice: Pick<Invoice, 'id' | 'code'>) => {
      setOpening(invoice.id);
      try {
        openBlob(await invoicesService.pdf(invoice.id), `nota-${invoice.code}.pdf`);
      } finally {
        setOpening(null);
      }
    },
  );
  return { openPdf: (invoice: Pick<Invoice, 'id' | 'code'>) => pdf.mutate(invoice), opening };
}

export function useInvoicesController() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [search, setSearchState] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<InvoiceStatus | ''>('');
  const [cancelling, setCancelling] = useState<Invoice | null>(null);
  const term = useDebounced(search);
  const filters = { page, limit: 12, search: term, status: status || undefined };

  const list = useQuery({
    queryKey: [...keys.invoices, 'list', filters],
    queryFn: () => invoicesService.list(filters),
    placeholderData: keepPreviousData,
  });

  const cancel = useAction((reason: string) => invoicesService.cancel(cancelling!.id, reason), {
    invalidate: [keys.invoices, keys.requests],
    success: 'Nota cancelada',
    onSuccess: () => setCancelling(null),
  });

  return {
    ...useInvoiceActions(),
    staff: isStaff(user),
    canCancel: isManager(user),
    rows: list.data?.items,
    meta: list.data?.meta,
    loading: list.isLoading,
    hasFilters: !!term || !!status,
    search,
    setSearch: (value: string) => {
      setSearchState(value);
      setPage(1);
    },
    status,
    setStatus: (value: InvoiceStatus | '') => {
      setStatus(value);
      setPage(1);
    },
    setPage,
    openRequest: (invoice: Invoice) => navigate(`/solicitacoes/${invoice.serviceRequestId}`),
    cancelling,
    setCancelling,
    confirmCancel: (reason: string) => cancel.mutate(reason),
    cancelBusy: cancel.isPending,
  };
}
