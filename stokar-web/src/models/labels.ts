import type {
  ContractStatus,
  CustomerType,
  InvoiceStatus,
  MovementType,
  PaymentMethod,
  PaymentStatus,
  PixKeyType,
  RequestPriority,
  RequestStatus,
  UserRole,
} from './types';

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  PIX: 'PIX',
  CASH: 'Dinheiro',
  DEBIT_CARD: 'Cartão de débito',
  CREDIT_CARD: 'Cartão de crédito',
  TRANSFER: 'Transferência',
  BOLETO: 'Boleto',
  OTHER: 'Outra forma',
};
export const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PAID: 'Pago',
  PENDING: 'A receber',
  NONE: 'Sem cobrança',
};
export const PAYMENT_STATUS_TONE: Record<PaymentStatus, Tone> = {
  PAID: 'success',
  PENDING: 'warning',
  NONE: 'neutral',
};

export const PIX_KEY_TYPE_LABEL: Record<PixKeyType, string> = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  EMAIL: 'E-mail',
  PHONE: 'Celular',
  RANDOM: 'Chave aleatória',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gestor',
  OPERATOR: 'Operador',
  REQUESTER: 'Solicitante',
  CLIENT: 'Cliente',
};

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  IN: 'Entrada',
  OUT: 'Saída',
  ADJUSTMENT: 'Ajuste',
};

export const MOVEMENT_TONE: Record<MovementType, Tone> = {
  IN: 'primary',
  OUT: 'info',
  ADJUSTMENT: 'warning',
};

export const STATUS_LABEL: Record<RequestStatus, string> = {
  OPEN: 'Aberta',
  APPROVED: 'Aprovada',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  REJECTED: 'Rejeitada',
  CANCELLED: 'Cancelada',
};

export const STATUS_TONE: Record<RequestStatus, Tone> = {
  OPEN: 'warning',
  APPROVED: 'info',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

export const PRIORITY_LABEL: Record<RequestPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const PRIORITY_TONE: Record<RequestPriority, Tone> = {
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
};

export const REQUEST_STATUSES = Object.keys(STATUS_LABEL) as RequestStatus[];
export const REQUEST_PRIORITIES = Object.keys(PRIORITY_LABEL) as RequestPriority[];
export const USER_ROLES = Object.keys(ROLE_LABEL) as UserRole[];
/** Perfis que usam o site. O acesso de cliente (aplicativo) é criado na tela do cliente. */
export const INTERNAL_USER_ROLES = USER_ROLES.filter((r) => r !== 'CLIENT');
export const MOVEMENT_TYPES = Object.keys(MOVEMENT_LABEL) as MovementType[];

export const CUSTOMER_TYPE_LABEL: Record<CustomerType, string> = {
  PERSON: 'Pessoa física',
  COMPANY: 'Empresa',
};

export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
  ENDED: 'Encerrado',
};

export const CONTRACT_STATUS_TONE: Record<ContractStatus, Tone> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  ENDED: 'neutral',
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  ISSUED: 'Emitida',
  CANCELLED: 'Cancelada',
};

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, Tone> = {
  ISSUED: 'success',
  CANCELLED: 'neutral',
};

export const CONTRACT_STATUSES = Object.keys(CONTRACT_STATUS_LABEL) as ContractStatus[];
