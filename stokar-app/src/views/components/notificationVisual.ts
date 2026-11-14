import { CircleCheck, ClipboardList, MessageCircle, Play, ReceiptText, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import type { Tone } from '@/models/labels';

/** Ícone e cor de cada tipo de notificação (lista de notificações e "Novidades" da tela inicial). */
export function notificationVisual(type: string): { icon: LucideIcon; tone: Tone } {
  if (type === 'CHAT_MESSAGE') return { icon: MessageCircle, tone: 'primary' };
  if (type === 'INVOICE_ISSUED') return { icon: ReceiptText, tone: 'success' };
  if (type === 'REQUEST_COMPLETED' || type === 'REQUEST_APPROVED') return { icon: CircleCheck, tone: 'success' };
  if (type === 'REQUEST_STARTED') return { icon: Play, tone: 'primary' };
  if (type === 'REQUEST_REJECTED' || type === 'REQUEST_CANCELLED') return { icon: TriangleAlert, tone: 'danger' };
  if (type === 'LOW_STOCK' || type === 'OUT_OF_STOCK') return { icon: TriangleAlert, tone: 'warning' };
  return { icon: ClipboardList, tone: 'info' };
}
