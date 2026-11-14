import type {
  AppNotification,
  AuthSession,
  AuthTokens,
  ChatMessage,
  CompanySettings,
  Contract,
  Conversation,
  Customer,
  CustomerProfile,
  CustomerType,
  Invoice,
  Paginated,
  Product,
  RequestStatus,
  Service,
  ServiceRequest,
  ServiceRequestInput,
  User,
  Vehicle,
  VehicleInput,
} from '../types';
import { cleanParams, http } from './http';

const data = <T>(promise: Promise<{ data: T }>) => promise.then((r) => r.data);
const get = <T>(url: string, params: object = {}) => data(http.get<T>(url, { params: cleanParams(params) }));

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

/* ---------- /auth ---------- */
export interface RegisterClientInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  customerType: CustomerType;
  companyName?: string;
  document?: string;
}

export const authService = {
  login: (body: { email: string; password: string }) => data(http.post<AuthSession>('/auth/login', body)),
  registerClient: (body: RegisterClientInput) => data(http.post<AuthSession>('/auth/register-client', body)),
  logout: () => http.post('/auth/logout'),
  me: () => get<User>('/auth/me'),
  updateMe: (body: { name?: string; phone?: string | null; emailNotifications?: boolean }) =>
    data(http.patch<User>('/auth/me', body)),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    data(http.post<AuthTokens>('/auth/change-password', body)),
  deleteAccount: (password: string) => http.delete('/auth/me', { data: { password } }),
};

/* ---------- Cadastro do cliente e veículos ---------- */
export const customersService = {
  me: () => get<CustomerProfile>('/customers/me'),
  updateMe: (body: Partial<Pick<Customer, 'name' | 'tradeName' | 'document' | 'email' | 'phone' | 'address'>>) =>
    data(http.patch<CustomerProfile>('/customers/me', body)),
  /* Equipe */
  search: (search: string) => get<Paginated<Customer>>('/customers', { search, active: true, limit: 20 }).then((r) => r.items),
  create: (body: { type: CustomerType; name: string; document?: string | null; phone?: string | null; email?: string | null }) =>
    data(http.post<Customer>('/customers', body)),
};

export const vehiclesService = {
  list: (customerId?: string) =>
    get<Paginated<Vehicle>>('/vehicles', { customerId, active: true, limit: 100 }).then((r) => r.items),
  create: (body: VehicleInput) => data(http.post<Vehicle>('/vehicles', body)),
  update: (id: string, body: Partial<VehicleInput>) => data(http.patch<Vehicle>(`/vehicles/${id}`, body)),
  remove: (id: string) => http.delete(`/vehicles/${id}`),
};

/* ---------- Catálogo, contratos e produtos ---------- */
export const catalogService = {
  services: (contractId?: string | null) =>
    get<Paginated<Service>>('/services', { limit: 100, contractId: contractId || undefined }).then((r) => r.items),
  contracts: (customerId?: string) =>
    get<Paginated<Contract>>('/contracts', { customerId, status: 'ACTIVE', limit: 100 }).then((r) =>
      r.items.filter((c) => c.usable),
    ),
  /** Equipe: peças do estoque */
  products: (search: string) =>
    get<Paginated<Product>>('/products', { search, active: true, limit: 20 }).then((r) => r.items),
};

/* ---------- /service-requests ---------- */
export interface RequestFilters extends ListParams {
  status?: RequestStatus;
}
const action =
  <B extends object | void = void>(name: string) =>
  (id: string, body?: B) =>
    data(http.post<ServiceRequest>(`/service-requests/${id}/${name}`, body ?? {}));

export const requestsService = {
  list: (params: RequestFilters) => get<Paginated<ServiceRequest>>('/service-requests', params),
  detail: (id: string) => get<ServiceRequest>(`/service-requests/${id}`),
  create: (body: ServiceRequestInput) => data(http.post<ServiceRequest>('/service-requests', body)),
  approve: action('approve'),
  reject: action<{ reason: string }>('reject'),
  start: action('start'),
  complete: action<{ resolutionNotes?: string }>('complete'),
  cancel: action<{ reason?: string }>('cancel'),
};

/* ---------- /invoices ---------- */
export const invoicesService = {
  list: (params: ListParams) => get<Paginated<Invoice>>('/invoices', params),
  issue: (serviceRequestId: string) => data(http.post<Invoice>('/invoices', { serviceRequestId })),
};

/* ---------- /chat ---------- */
export const chatService = {
  unreadCount: () => get<{ count: number }>('/chat/unread-count').then((r) => r.count),
  mine: () => get<Conversation>('/chat/conversations/mine'),
  conversations: (params: ListParams & { unread?: boolean }) => get<Paginated<Conversation>>('/chat/conversations', params),
  messages: (id: string, params: { after?: string; before?: string; limit?: number } = {}) =>
    get<{ items: ChatMessage[]; conversation: Conversation }>(`/chat/conversations/${id}/messages`, params),
  send: (id: string, body: string) => data(http.post<ChatMessage>(`/chat/conversations/${id}/messages`, { body })),
  markRead: (id: string) => http.post(`/chat/conversations/${id}/read`),
};

/* ---------- /notifications e /settings ---------- */
export const notificationsService = {
  list: (params: { page?: number; limit?: number; unread?: boolean }) =>
    get<Paginated<AppNotification> & { unreadCount: number }>('/notifications', params),
  unreadCount: () => get<{ count: number }>('/notifications/unread-count').then((r) => r.count),
  markRead: (id: string) => http.patch(`/notifications/${id}/read`),
  markAllRead: () => http.patch('/notifications/read-all'),
};

export const settingsService = {
  company: () => get<CompanySettings>('/settings/company'),
};
