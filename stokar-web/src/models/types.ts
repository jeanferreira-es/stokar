/** Tipos que espelham as respostas da stokar-api. */

export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'REQUESTER' | 'CLIENT';
export type CustomerType = 'PERSON' | 'COMPANY';
export type ContractStatus = 'ACTIVE' | 'SUSPENDED' | 'ENDED';
export type InvoiceStatus = 'ISSUED' | 'CANCELLED';
export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';
export type RequestStatus = 'OPEN' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type NotificationType =
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'REQUEST_CREATED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'REQUEST_STARTED'
  | 'REQUEST_COMPLETED'
  | 'REQUEST_CANCELLED'
  | 'REQUEST_ASSIGNED'
  | 'INVOICE_ISSUED'
  | 'CHAT_MESSAGE';

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  customerId: string | null;
  active: boolean;
  emailNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession extends AuthTokens {
  user: User;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  salePrice: number;
  location: string | null;
  active: boolean;
  categoryId: string | null;
  category?: Category | null;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  sku: string;
  name: string;
  description?: string | null;
  unit?: string;
  minQuantity?: number;
  costPrice?: number;
  salePrice?: number;
  location?: string | null;
  categoryId?: string | null;
  active?: boolean;
}

export interface StockMovement {
  id: string;
  type: MovementType;
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  unitCost: number | null;
  reason: string | null;
  document: string | null;
  productId: string;
  product?: Pick<Product, 'id' | 'sku' | 'name' | 'unit'>;
  supplier?: Pick<Supplier, 'id' | 'name'> | null;
  user?: Pick<User, 'id' | 'name'>;
  serviceRequest?: { id: string; code: string; title: string } | null;
  createdAt: string;
}

export interface StockEntryInput {
  productId: string;
  quantity: number;
  unitCost?: number;
  supplierId?: string;
  document?: string;
  reason?: string;
}

export interface StockExitInput {
  productId: string;
  quantity: number;
  document?: string;
  reason?: string;
}

export interface StockAdjustmentInput {
  productId: string;
  newQuantity: number;
  reason: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
}

export interface ServiceRequestItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product?: { id: string; sku: string; name: string; unit: string; available: number };
}

/** Serviço (mão de obra) lançado na solicitação */
export interface ServiceRequestLine {
  id: string;
  serviceId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface RequestTotals {
  services: number;
  parts: number;
  discount: number;
  total: number;
}

export interface ServiceRequest {
  id: string;
  number: number;
  code: string;
  title: string;
  description: string;
  priority: RequestPriority;
  status: RequestStatus;
  statusReason: string | null;
  resolutionNotes: string | null;
  dueDate: string | null;
  origin: 'WEB' | 'APP';
  discount: number;
  requesterId: string;
  requester?: Person;
  assigneeId: string | null;
  assignee?: Person | null;
  customerId: string | null;
  customer?: Pick<Customer, 'id' | 'type' | 'name' | 'tradeName' | 'document' | 'phone'> | null;
  contractId: string | null;
  contract?: { id: string; code: string; title: string } | null;
  vehicleId: string | null;
  vehicle?: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model' | 'year' | 'color'> | null;
  services?: ServiceRequestLine[];
  items?: ServiceRequestItem[];
  totals?: RequestTotals;
  /** Nota emitida (só vem no detalhe) */
  invoice?: { id: string; code: string; total: number; issuedAt: string } | null;
  approvedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestInput {
  title: string;
  description: string;
  priority?: RequestPriority;
  dueDate?: string | null;
  customerId?: string | null;
  contractId?: string | null;
  vehicleId?: string | null;
  discount?: number;
  services?: Array<{ serviceId?: string; description?: string; quantity: number; unitPrice?: number }>;
  items?: Array<{ productId: string; quantity: number; unitPrice?: number }>;
}

/* ---------- Oficina ---------- */

export interface Customer {
  id: string;
  type: CustomerType;
  name: string;
  tradeName: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInput {
  type?: CustomerType;
  name: string;
  tradeName?: string | null;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  active?: boolean;
}

export interface CustomerProfile extends Customer {
  vehicles: Vehicle[];
  contracts: Contract[];
  users: User[];
}

export interface Vehicle {
  id: string;
  customerId: string;
  plate: string | null;
  brand: string | null;
  model: string;
  year: number | null;
  color: string | null;
  notes: string | null;
  active: boolean;
}

export interface VehicleInput {
  customerId?: string;
  plate?: string | null;
  brand?: string | null;
  model: string;
  year?: number | null;
  color?: string | null;
  notes?: string | null;
  active?: boolean;
}

export interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  estimatedMinutes: number | null;
  active: boolean;
  serviceTypeId: string | null;
  serviceType?: ServiceType | null;
  /** Valor para o contrato informado na consulta */
  contractPrice?: number;
}

export interface ServiceInput {
  name: string;
  description?: string | null;
  price: number;
  estimatedMinutes?: number | null;
  serviceTypeId?: string | null;
  active?: boolean;
}

export interface Contract {
  id: string;
  number: number;
  code: string;
  title: string;
  description: string | null;
  status: ContractStatus;
  startDate: string;
  endDate: string | null;
  monthlyValue: number | null;
  discountPercent: number;
  /** Ativo e dentro da vigência */
  usable: boolean;
  customerId: string;
  customer?: Pick<Customer, 'id' | 'name' | 'tradeName' | 'document'>;
  services?: Array<{ id: string; serviceId: string; price: number; service?: Pick<Service, 'id' | 'name' | 'price'> }>;
}

export interface ContractInput {
  customerId: string;
  title: string;
  description?: string | null;
  status?: ContractStatus;
  startDate: string;
  endDate?: string | null;
  monthlyValue?: number | null;
  discountPercent?: number;
  services?: Array<{ serviceId: string; price: number }>;
}

export interface InvoiceParty {
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface Invoice {
  id: string;
  number: number;
  code: string;
  status: InvoiceStatus;
  serviceRequestId: string;
  customerId: string | null;
  issuer: InvoiceParty;
  recipient: InvoiceParty | null;
  reference: { requestCode: string; title: string; vehicle: string | null; contractCode: string | null };
  lines: Array<{ kind: 'SERVICE' | 'PART'; description: string; quantity: number; unit: string | null; unitPrice: number; total: number }>;
  servicesTotal: number;
  partsTotal: number;
  discount: number;
  total: number;
  notes: string | null;
  issuedAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
}

export interface CompanySettings {
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  invoiceFooter: string | null;
}

export interface Conversation {
  id: string;
  userId: string;
  customerId: string | null;
  user?: { id: string; name: string; email: string; phone: string | null };
  customer?: Pick<Customer, 'id' | 'name' | 'tradeName'> | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unread: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  fromStaff: boolean;
  body: string;
  sender: { id: string; name: string } | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationList extends Paginated<AppNotification> {
  unreadCount: number;
}

export interface ReportSummary {
  stock: { activeProducts: number; lowStock: number; outOfStock: number; totalValue: number };
  serviceRequests: Record<RequestStatus, number>;
  movementsLast30Days: Array<{ type: MovementType; count: number; quantity: number }>;
}

export type SeriesGranularity = 'day' | 'week' | 'month';

export interface MovementSeriesPoint {
  /** Início do período, AAAA-MM-DD */
  bucket: string;
  in: number;
  out: number;
  adjustments: number;
  movements: number;
}

export interface MovementSeries {
  granularity: SeriesGranularity;
  points: MovementSeriesPoint[];
}

export interface TopProduct {
  product: Pick<Product, 'id' | 'sku' | 'name' | 'unit' | 'quantity' | 'minQuantity'>;
  movements: number;
  quantity: number;
}

export interface MyRequestsSummary {
  total: number;
  byStatus: Record<RequestStatus, number>;
}
