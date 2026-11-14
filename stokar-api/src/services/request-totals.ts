import { ServiceRequest } from '../entities';

const cents = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export interface RequestTotals {
  services: number;
  parts: number;
  discount: number;
  total: number;
}

/** Totais de uma solicitação com `services` e `items` carregados. */
export function computeTotals(request: Pick<ServiceRequest, 'services' | 'items' | 'discount'>): RequestTotals {
  const services = cents((request.services ?? []).reduce((sum, s) => sum + s.quantity * s.unitPrice, 0));
  const parts = cents((request.items ?? []).reduce((sum, i) => sum + i.quantity * i.unitPrice, 0));
  const discount = Math.min(request.discount ?? 0, cents(services + parts));
  return { services, parts, discount, total: cents(services + parts - discount) };
}
