/** Tipos que espelham as respostas da stokar-api (mesmos nomes usados no stokar-web). */

export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'REQUESTER' | 'CLIENT';
export type CustomerType = 'PERSON' | 'COMPANY';
export type ContractStatus = 'ACTIVE' | 'SUSPENDED' | 'ENDED';
export type InvoiceStatus = 'ISSUED' | 'CANCELLED';
export type RequestStatus = 'OPEN' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

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

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  customerId: string | null;
  active: boolean;
  emailNotifications: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession extends AuthTokens {
  user: User;
}

export interface Customer {
  id: string;
  type: CustomerType;
  name: string;
  tradeName: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
}

export type CustomerSummary = Pick<Customer, 'id' | 'name' | 'tradeName' | 'document'>;

export interface CustomerProfile extends Customer {
  vehicles: Vehicle[];
  contracts: Contract[];
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
}

export interface ServiceType {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  estimatedMinutes: number | null;
  serviceTypeId: string | null;
  serviceType?: ServiceType | null;
  /** Valor para o contrato informado na consulta */
  contractPrice?: number;
}

export interface Contract {
  id: string;
  code: string;
  title: string;
  status: ContractStatus;
  startDate: string;
  endDate: string | null;
  discountPercent: number;
  /** Ativo e dentro da vigência */
  usable: boolean;
  customerId: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  unit: string;
  quantity: number;
  salePrice: number;
}

export interface Person {
  id: string;
  name: string;
  email: string;
}

export interface RequestLine {
  id: string;
  serviceId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface RequestItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product?: { id: string; sku: string; name: string; unit: string; available?: number };
}

export interface ServiceRequest {
  id: string;
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
  customer?: (CustomerSummary & { type: CustomerType; phone: string | null }) | null;
  contractId: string | null;
  contract?: { id: string; code: string; title: string } | null;
  vehicleId: string | null;
  vehicle?: Pick<Vehicle, 'id' | 'plate' | 'brand' | 'model' | 'year' | 'color'> | null;
  services?: RequestLine[];
  items?: RequestItem[];
  totals?: { services: number; parts: number; discount: number; total: number };
  payment?: RequestPayment;
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
  customerId?: string | null;
  contractId?: string | null;
  vehicleId?: string | null;
  origin: 'APP';
  discount?: number;
  services?: Array<{ serviceId?: string; description?: string; quantity: number; unitPrice?: number }>;
  items?: Array<{ productId: string; quantity: number; unitPrice?: number }>;
}

export interface Invoice {
  id: string;
  code: string;
  status: InvoiceStatus;
  serviceRequestId: string;
  recipient: { name: string } | null;
  reference: { requestCode: string; title: string; vehicle: string | null };
  total: number;
  issuedAt: string;
}

export interface CompanySettings {
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  pixKeyType?: PixKeyType | null;
  pixKey?: string | null;
  paymentInstructions?: string | null;
  requirePaymentToComplete?: boolean;
}

export type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
export type PaymentMethod = 'PIX' | 'CASH' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'TRANSFER' | 'BOLETO' | 'OTHER';
/** PAID: pago · PENDING: aprovado em diante, com valor e sem pagamento · NONE: sem cobrança */
export type PaymentStatus = 'PAID' | 'PENDING' | 'NONE';

export interface RequestPayment {
  status: PaymentStatus;
  paidAt: string | null;
  method: PaymentMethod | null;
  notes?: string | null;
  confirmedBy?: { id: string; name: string } | null;
}

/** Um serviço com valor ainda não pago */
export interface PendingPayment {
  id: string;
  code: string;
  title: string;
  status: RequestStatus;
  total: number;
  createdAt: string;
  completedAt: string | null;
  customer: { id: string; name: string } | null;
  vehicle: { plate: string | null; brand: string | null; model: string } | null;
  /** "PIX copia e cola" com o valor (null quando a oficina não cadastrou chave e cidade) */
  pixCode: string | null;
}

export interface PendingPayments {
  items: PendingPayment[];
  count: number;
  total: number;
  pix: { key: string | null; keyType: PixKeyType | null; receiverName: string; instructions: string | null };
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
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}
