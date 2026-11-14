import {
  Ban,
  CircleCheck,
  CircleX,
  ClipboardPlus,
  MessageCircle,
  ReceiptText,
  PackageX,
  Play,
  ThumbsUp,
  TriangleAlert,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';
import type { Tone } from '@/models/labels';
import type { NotificationType } from '@/models/types';

/** Ícone e cor de cada tipo de notificação da API. */
export const NOTIFICATION_VISUAL: Record<NotificationType, { icon: LucideIcon; tone: Tone }> = {
  LOW_STOCK: { icon: TriangleAlert, tone: 'warning' },
  OUT_OF_STOCK: { icon: PackageX, tone: 'danger' },
  REQUEST_CREATED: { icon: ClipboardPlus, tone: 'primary' },
  REQUEST_APPROVED: { icon: ThumbsUp, tone: 'info' },
  REQUEST_REJECTED: { icon: CircleX, tone: 'danger' },
  REQUEST_STARTED: { icon: Play, tone: 'primary' },
  REQUEST_COMPLETED: { icon: CircleCheck, tone: 'success' },
  REQUEST_CANCELLED: { icon: Ban, tone: 'neutral' },
  REQUEST_ASSIGNED: { icon: UserCheck, tone: 'info' },
  INVOICE_ISSUED: { icon: ReceiptText, tone: 'success' },
  CHAT_MESSAGE: { icon: MessageCircle, tone: 'primary' },
};
