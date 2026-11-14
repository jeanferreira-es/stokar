import { PaymentMethod } from '../entities';

/** Nome da forma de pagamento como aparece em notificações e na nota. */
export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  PIX: 'PIX',
  CASH: 'dinheiro',
  DEBIT_CARD: 'cartão de débito',
  CREDIT_CARD: 'cartão de crédito',
  TRANSFER: 'transferência',
  BOLETO: 'boleto',
  OTHER: 'outra forma',
};
