import type {
  AppNotification,
  AuthSession,
  AuthTokens,
  Category,
  ChatMessage,
  CompanySettings,
  Contract,
  ContractInput,
  ContractStatus,
  Conversation,
  Customer,
  CustomerInput,
  CustomerProfile,
  CustomerType,
  Invoice,
  InvoiceStatus,
  ListParams,
  MovementSeries,
  MovementType,
  MyRequestsSummary,
  NotificationList,
  Paginated,
  PaymentInput,
  Product,
  ProductInput,
  ReportSummary,
  RequestPriority,
  RequestStatus,
  SeriesGranularity,
  Service,
  ServiceInput,
  ServiceRequest,
  ServiceRequestInput,
  ServiceType,
  StockAdjustmentInput,
  StockEntryInput,
  StockExitInput,
  StockMovement,
  Supplier,
  TopProduct,
  User,
  UserRole,
  Vehicle,
  VehicleInput,
} from '../types';
import { cleanParams, http } from './http';

const data = <T>(promise: Promise<{ data: T }>) => promise.then((r) => r.data);
const get = <T>(url: string, params: object = {}) => data(http.get<T>(url, { params: cleanParams(params) }));

/* ---------- /auth ---------- */
export const authService = {
  login: (body: { email: string; password: string }) => data(http.post<AuthSession>('/auth/login', body)),
  register: (body: { name: string; email: string; password: string }) =>
    data(http.post<AuthSession>('/auth/register', body)),
  logout: () => http.post('/auth/logout'),
  me: () => get<User>('/auth/me'),
  updateMe: (body: { name?: string; emailNotifications?: boolean }) => data(http.patch<User>('/auth/me', body)),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    data(http.post<AuthTokens>('/auth/change-password', body)),
};

/* ---------- /users ---------- */
export interface UserFilters extends ListParams {
  role?: UserRole;
  customerId?: string;
  active?: boolean;
}
export const usersService = {
  list: (params: UserFilters) => get<Paginated<User>>('/users', params),
  create: (body: { name: string; email: string; password: string; role: UserRole }) =>
    data(http.post<User>('/users', body)),
  update: (id: string, body: { name?: string; role?: UserRole; active?: boolean; password?: string }) =>
    data(http.patch<User>(`/users/${id}`, body)),
  deactivate: (id: string) => http.delete(`/users/${id}`),
};

/* ---------- /categories ---------- */
export type CategoryInput = { name: string; description?: string | null };
export const categoriesService = {
  list: (params: ListParams) => get<Paginated<Category>>('/categories', params),
  create: (body: CategoryInput) => data(http.post<Category>('/categories', body)),
  update: (id: string, body: Partial<CategoryInput>) => data(http.patch<Category>(`/categories/${id}`, body)),
  remove: (id: string) => http.delete(`/categories/${id}`),
};

/* ---------- /suppliers ---------- */
export type SupplierInput = {
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  active?: boolean;
};
export const suppliersService = {
  list: (params: ListParams & { active?: boolean }) => get<Paginated<Supplier>>('/suppliers', params),
  create: (body: SupplierInput) => data(http.post<Supplier>('/suppliers', body)),
  update: (id: string, body: Partial<SupplierInput>) => data(http.patch<Supplier>(`/suppliers/${id}`, body)),
  deactivate: (id: string) => http.delete(`/suppliers/${id}`),
};

/* ---------- /products ---------- */
export interface ProductFilters extends ListParams {
  categoryId?: string;
  active?: boolean;
  lowStock?: boolean;
}
export const productsService = {
  list: (params: ProductFilters) => get<Paginated<Product>>('/products', params),
  create: (body: ProductInput) => data(http.post<Product>('/products', body)),
  update: (id: string, body: Partial<ProductInput>) => data(http.patch<Product>(`/products/${id}`, body)),
  deactivate: (id: string) => http.delete(`/products/${id}`),
};

/* ---------- /stock ---------- */
export interface MovementFilters extends ListParams {
  productId?: string;
  type?: MovementType;
  from?: string;
  to?: string;
}
export const stockService = {
  movements: (params: MovementFilters) => get<Paginated<StockMovement>>('/stock/movements', params),
  entry: (body: StockEntryInput) => data(http.post<StockMovement>('/stock/entries', body)),
  exit: (body: StockExitInput) => data(http.post<StockMovement>('/stock/exits', body)),
  adjust: (body: StockAdjustmentInput) => data(http.post<StockMovement>('/stock/adjustments', body)),
};

/* ---------- /service-requests ---------- */
export interface RequestFilters extends ListParams {
  status?: RequestStatus;
  priority?: RequestPriority;
  assigneeId?: string;
  customerId?: string;
  /** pending: a receber · paid: pagas */
  payment?: 'pending' | 'paid';
}
const requestAction =
  <B extends object | void = void>(action: string) =>
  (id: string, body?: B) =>
    data(http.post<ServiceRequest>(`/service-requests/${id}/${action}`, body ?? {}));

export const serviceRequestsService = {
  list: (params: RequestFilters) => get<Paginated<ServiceRequest>>('/service-requests', params),
  detail: (id: string) => get<ServiceRequest>(`/service-requests/${id}`),
  create: (body: ServiceRequestInput) => data(http.post<ServiceRequest>('/service-requests', body)),
  update: (id: string, body: Partial<ServiceRequestInput>) =>
    data(http.patch<ServiceRequest>(`/service-requests/${id}`, body)),
  approve: requestAction<{ assigneeId?: string }>('approve'),
  reject: requestAction<{ reason: string }>('reject'),
  assign: requestAction<{ assigneeId: string }>('assign'),
  start: requestAction('start'),
  complete: requestAction<{ resolutionNotes?: string }>('complete'),
  cancel: requestAction<{ reason?: string }>('cancel'),
  registerPayment: requestAction<PaymentInput>('payment'),
  undoPayment: (id: string) => data(http.delete<ServiceRequest>(`/service-requests/${id}/payment`)),
};

/* ---------- /notifications ---------- */
export const notificationsService = {
  list: (params: { page?: number; limit?: number; unread?: boolean }) =>
    get<NotificationList>('/notifications', params),
  unreadCount: () => get<{ count: number }>('/notifications/unread-count').then((r) => r.count),
  markRead: (id: string) => data(http.patch<AppNotification>(`/notifications/${id}/read`)),
  markAllRead: () => data(http.patch<{ updated: number }>('/notifications/read-all')),
  remove: (id: string) => http.delete(`/notifications/${id}`),
};

/* ---------- /reports ---------- */
export const reportsService = {
  summary: () => get<ReportSummary>('/reports/summary'),
  movementsSeries: (params: { granularity: SeriesGranularity; points: number }) =>
    get<MovementSeries>('/reports/movements-series', {
      ...params,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  topProducts: (params: { days?: number; limit?: number; type?: MovementType }) =>
    get<{ items: TopProduct[] }>('/reports/top-products', params).then((r) => r.items),
  myRequests: () => get<MyRequestsSummary>('/reports/my-requests'),
};

/* ---------- /customers e /vehicles ---------- */
export const customersService = {
  list: (params: ListParams & { type?: CustomerType; active?: boolean }) => get<Paginated<Customer>>('/customers', params),
  detail: (id: string) => get<CustomerProfile>(`/customers/${id}`),
  create: (body: CustomerInput) => data(http.post<Customer>('/customers', body)),
  update: (id: string, body: Partial<CustomerInput>) => data(http.patch<Customer>(`/customers/${id}`, body)),
  deactivate: (id: string) => http.delete(`/customers/${id}`),
  createAccess: (id: string, body: { name: string; email: string; password: string; phone?: string | null }) =>
    data(http.post<User>(`/customers/${id}/users`, body)),
};

export const vehiclesService = {
  list: (params: ListParams & { customerId?: string; active?: boolean }) => get<Paginated<Vehicle>>('/vehicles', params),
  create: (body: VehicleInput) => data(http.post<Vehicle>('/vehicles', body)),
  update: (id: string, body: Partial<VehicleInput>) => data(http.patch<Vehicle>(`/vehicles/${id}`, body)),
  deactivate: (id: string) => http.delete(`/vehicles/${id}`),
};

/* ---------- /service-types e /services (catálogo) ---------- */
export type ServiceTypeInput = { name: string; description?: string | null; active?: boolean };
export const serviceTypesService = {
  list: (params: ListParams & { active?: boolean }) => get<Paginated<ServiceType>>('/service-types', params),
  create: (body: ServiceTypeInput) => data(http.post<ServiceType>('/service-types', body)),
  update: (id: string, body: Partial<ServiceTypeInput>) => data(http.patch<ServiceType>(`/service-types/${id}`, body)),
  remove: (id: string) => http.delete(`/service-types/${id}`),
};

export interface ServiceFilters extends ListParams {
  serviceTypeId?: string;
  active?: boolean;
  contractId?: string;
}
export const servicesService = {
  list: (params: ServiceFilters) => get<Paginated<Service>>('/services', params),
  create: (body: ServiceInput) => data(http.post<Service>('/services', body)),
  update: (id: string, body: Partial<ServiceInput>) => data(http.patch<Service>(`/services/${id}`, body)),
  deactivate: (id: string) => http.delete(`/services/${id}`),
};

/* ---------- /contracts ---------- */
export const contractsService = {
  list: (params: ListParams & { customerId?: string; status?: ContractStatus }) =>
    get<Paginated<Contract>>('/contracts', params),
  detail: (id: string) => get<Contract>(`/contracts/${id}`),
  create: (body: ContractInput) => data(http.post<Contract>('/contracts', body)),
  update: (id: string, body: Partial<Omit<ContractInput, 'customerId'>>) =>
    data(http.patch<Contract>(`/contracts/${id}`, body)),
};

/* ---------- /invoices (notas de serviço) ---------- */
export interface InvoiceFilters extends ListParams {
  status?: InvoiceStatus;
  customerId?: string;
  from?: string;
  to?: string;
}
export const invoicesService = {
  list: (params: InvoiceFilters) => get<Paginated<Invoice>>('/invoices', params),
  issue: (body: { serviceRequestId: string; notes?: string }) => data(http.post<Invoice>('/invoices', body)),
  cancel: (id: string, reason: string) => data(http.post<Invoice>(`/invoices/${id}/cancel`, { reason })),
  /** O PDF exige o token no cabeçalho, por isso é baixado como blob (e não aberto por link direto). */
  pdf: (id: string) => data(http.get<Blob>(`/invoices/${id}/pdf`, { responseType: 'blob' })),
};

/* ---------- /chat ---------- */
export const chatService = {
  unreadCount: () => get<{ count: number; conversations: number }>('/chat/unread-count'),
  conversations: (params: ListParams & { unread?: boolean }) => get<Paginated<Conversation>>('/chat/conversations', params),
  start: (userId: string) => data(http.post<Conversation>('/chat/conversations', { userId })),
  messages: (id: string, params: { after?: string; before?: string; limit?: number } = {}) =>
    get<{ items: ChatMessage[]; conversation: Conversation }>(`/chat/conversations/${id}/messages`, params),
  send: (id: string, body: string) => data(http.post<ChatMessage>(`/chat/conversations/${id}/messages`, { body })),
  markRead: (id: string) => http.post(`/chat/conversations/${id}/read`),
};

/* ---------- /settings ---------- */
export const settingsService = {
  company: () => get<CompanySettings>('/settings/company'),
  updateCompany: (body: Partial<CompanySettings>) => data(http.put<CompanySettings>('/settings/company', body)),
};
