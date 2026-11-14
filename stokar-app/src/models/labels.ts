import type { RequestPriority, RequestStatus, UserRole } from './types';

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gestor',
  OPERATOR: 'Operador',
  REQUESTER: 'Solicitante',
  CLIENT: 'Cliente',
};

export const STATUS_LABEL: Record<RequestStatus, string> = {
  OPEN: 'Aberta',
  APPROVED: 'Aprovada',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  REJECTED: 'Rejeitada',
  CANCELLED: 'Cancelada',
};

/** Como o cliente lê cada etapa */
export const STATUS_HINT: Record<RequestStatus, string> = {
  OPEN: 'Aguardando a oficina aprovar',
  APPROVED: 'Aprovada, aguardando o início',
  IN_PROGRESS: 'A oficina está trabalhando',
  COMPLETED: 'Serviço concluído',
  REJECTED: 'A oficina não pôde atender',
  CANCELLED: 'Pedido cancelado',
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

export const REQUEST_STATUSES = Object.keys(STATUS_LABEL) as RequestStatus[];
export const REQUEST_PRIORITIES = Object.keys(PRIORITY_LABEL) as RequestPriority[];
