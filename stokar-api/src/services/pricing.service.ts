import { AppDataSource } from '../database/data-source';
import { Contract, ContractService, ContractStatus, Service } from '../entities';
import { round } from '../utils/numeric';
import { today } from '../utils/schemas';

export interface ContractPricing {
  contract: Contract;
  /** serviceId -> preço negociado */
  prices: Map<string, number>;
}

/** Contrato ativo e dentro da vigência. */
export function isContractUsable(contract: Contract, on = today()): boolean {
  return (
    contract.status === ContractStatus.ACTIVE &&
    contract.startDate <= on &&
    (contract.endDate === null || contract.endDate >= on)
  );
}

export async function loadContractPricing(contractId: string): Promise<ContractPricing | null> {
  const contract = await AppDataSource.getRepository(Contract).findOne({ where: { id: contractId } });
  if (!contract) return null;
  const items = await AppDataSource.getRepository(ContractService).find({ where: { contractId } });
  return { contract, prices: new Map(items.map((i) => [i.serviceId, i.price])) };
}

/**
 * Valor de um serviço: o preço negociado no contrato, se houver; senão o
 * valor padrão do catálogo com o desconto percentual do contrato.
 */
export function priceFor(service: Pick<Service, 'id' | 'price'>, pricing?: ContractPricing | null): number {
  if (!pricing) return service.price;
  const negotiated = pricing.prices.get(service.id);
  if (negotiated !== undefined) return negotiated;
  return round(service.price * (1 - pricing.contract.discountPercent / 100), 2);
}
