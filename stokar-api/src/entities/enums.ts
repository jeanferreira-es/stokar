export enum UserRole {
  /** Acesso total, inclusive gestão de usuários */
  ADMIN = 'ADMIN',
  /** Gestor: cadastros, ajustes de estoque e aprovação de solicitações */
  MANAGER = 'MANAGER',
  /** Almoxarife/técnico: movimenta o estoque e atende solicitações */
  OPERATOR = 'OPERATOR',
  /** Solicitante: abre e acompanha as próprias solicitações */
  REQUESTER = 'REQUESTER',
  /** Cliente da oficina: usa o aplicativo para pedir serviços, acompanhar e conversar */
  CLIENT = 'CLIENT',
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum RequestStatus {
  OPEN = 'OPEN',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum RequestPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationType {
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  REQUEST_CREATED = 'REQUEST_CREATED',
  REQUEST_APPROVED = 'REQUEST_APPROVED',
  REQUEST_REJECTED = 'REQUEST_REJECTED',
  REQUEST_STARTED = 'REQUEST_STARTED',
  REQUEST_COMPLETED = 'REQUEST_COMPLETED',
  REQUEST_CANCELLED = 'REQUEST_CANCELLED',
  REQUEST_ASSIGNED = 'REQUEST_ASSIGNED',
  INVOICE_ISSUED = 'INVOICE_ISSUED',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
}

export enum CustomerType {
  /** Pessoa física */
  PERSON = 'PERSON',
  /** Pessoa jurídica (empresa) */
  COMPANY = 'COMPANY',
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  ENDED = 'ENDED',
}

export enum InvoiceStatus {
  ISSUED = 'ISSUED',
  CANCELLED = 'CANCELLED',
}

/** Como o cliente pagou o serviço */
export enum PaymentMethod {
  PIX = 'PIX',
  CASH = 'CASH',
  DEBIT_CARD = 'DEBIT_CARD',
  CREDIT_CARD = 'CREDIT_CARD',
  TRANSFER = 'TRANSFER',
  BOLETO = 'BOLETO',
  OTHER = 'OTHER',
}

/** Tipo da chave PIX da oficina */
export enum PixKeyType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  RANDOM = 'RANDOM',
}

/** Por onde a solicitação foi aberta */
export enum RequestOrigin {
  WEB = 'WEB',
  APP = 'APP',
}

/** Perfis que operam o almoxarifado */
export const STAFF_ROLES = [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR];
/** Perfis de gestão */
export const MANAGER_ROLES = [UserRole.ADMIN, UserRole.MANAGER];
/** Perfis internos da empresa (todos menos o cliente do aplicativo) */
export const INTERNAL_ROLES = [...STAFF_ROLES, UserRole.REQUESTER];
