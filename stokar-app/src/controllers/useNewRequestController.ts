import { useEffect, useMemo, useState } from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import { useCurrentUser } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { isStaff } from '@/models/permissions';
import { catalogService, requestsService, vehiclesService } from '@/models/services/api';
import type { Contract, CustomerSummary, Product, Service, ServiceRequest, Vehicle } from '@/models/types';
import { parseNumber } from '@/utils/format';

export interface ServiceDraft {
  key: string;
  serviceId?: string;
  description: string;
  quantity: string;
  /** Valor unitário como texto (a equipe pode ajustar) */
  unitPrice: string;
}

export interface PartDraft {
  productId: string;
  name: string;
  unit: string;
  available: number;
  quantity: string;
  unitPrice: string;
}

const money = (value: number) => value.toFixed(2).replace('.', ',');
const amount = (value: string) => parseNumber(value) ?? 0;
let draftKey = 0;

/**
 * Formulário "Pedir serviço" (cliente) e "Registrar serviço" (equipe).
 * Cliente: usa o próprio cadastro, escolhe veículo, contrato e serviços do catálogo.
 * Equipe: escolhe o cliente e pode lançar serviços avulsos, peças do estoque, valores e desconto.
 */
export function useNewRequestController(initialCustomer?: CustomerSummary) {
  const user = useCurrentUser();
  const toast = useToast();
  const { profile, touchRequests } = useAppData();
  const staff = isStaff(user);

  const [customer, setCustomerState] = useState<CustomerSummary | null>(initialCustomer ?? null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [catalog, setCatalog] = useState<Service[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [contract, setContractState] = useState<Contract | null>(null);
  const [description, setDescription] = useState('');
  const [services, setServices] = useState<ServiceDraft[]>([]);
  const [parts, setParts] = useState<PartDraft[]>([]);
  const [discount, setDiscount] = useState('');
  const [errors, setErrors] = useState<{ description?: string; lines?: string; customer?: string }>({});
  const [saving, setSaving] = useState(false);

  const customerId = staff ? customer?.id : (profile?.id ?? undefined);

  // Cliente: veículos e contratos vêm do cadastro compartilhado no contexto
  useEffect(() => {
    if (staff || !profile) return;
    const active = profile.vehicles.filter((v) => v.active);
    const usable = profile.contracts.filter((c) => c.usable);
    setVehicles(active);
    setContracts(usable);
    setVehicle((current) => current ?? (active.length === 1 ? active[0] : null));
    setContractState((current) => current ?? (usable.length === 1 ? usable[0] : null));
  }, [staff, profile]);

  // Equipe: carrega veículos e contratos do cliente escolhido
  useEffect(() => {
    if (!staff) return;
    setVehicle(null);
    setContractState(null);
    setVehicles([]);
    setContracts([]);
    if (!customer) return;
    let active = true;
    Promise.all([vehiclesService.list(customer.id), catalogService.contracts(customer.id)])
      .then(([v, c]) => {
        if (!active) return;
        setVehicles(v);
        setContracts(c);
        if (c.length === 1) setContractState(c[0]);
      })
      .catch((error: unknown) => active && toast.error(error));
    return () => {
      active = false;
    };
  }, [staff, customer, toast]);

  // O catálogo depende do contrato: com contrato, vêm os valores negociados
  useEffect(() => {
    let active = true;
    catalogService
      .services(contract?.id)
      .then((list) => {
        if (!active) return;
        setCatalog(list);
        // Atualiza o valor dos serviços de catálogo já escolhidos
        setServices((lines) =>
          lines.map((line) => {
            const service = list.find((s) => s.id === line.serviceId);
            return service ? { ...line, unitPrice: money(service.contractPrice ?? service.price) } : line;
          }),
        );
      })
      .catch((error: unknown) => active && toast.error(error));
    return () => {
      active = false;
    };
  }, [contract?.id, toast]);

  const clearError = () => setErrors({});

  const toggleService = (service: Service) => {
    clearError();
    setServices((lines) =>
      lines.some((l) => l.serviceId === service.id)
        ? lines.filter((l) => l.serviceId !== service.id)
        : [
            ...lines,
            {
              key: `s-${(draftKey += 1)}`,
              serviceId: service.id,
              description: service.name,
              quantity: '1',
              unitPrice: money(service.contractPrice ?? service.price),
            },
          ],
    );
  };
  const addCustomService = () =>
    setServices((lines) => [...lines, { key: `s-${(draftKey += 1)}`, description: '', quantity: '1', unitPrice: '' }]);
  const patchService = (key: string, changes: Partial<ServiceDraft>) => {
    clearError();
    setServices((lines) => lines.map((l) => (l.key === key ? { ...l, ...changes } : l)));
  };
  const removeService = (key: string) => setServices((lines) => lines.filter((l) => l.key !== key));

  const addPart = (product: Product) => {
    clearError();
    setParts((list) =>
      list.some((p) => p.productId === product.id)
        ? list
        : [
            ...list,
            {
              productId: product.id,
              name: product.name,
              unit: product.unit,
              available: product.quantity,
              quantity: '1',
              unitPrice: money(product.salePrice ?? 0),
            },
          ],
    );
  };
  const patchPart = (productId: string, changes: Partial<PartDraft>) => {
    clearError();
    setParts((list) => list.map((p) => (p.productId === productId ? { ...p, ...changes } : p)));
  };
  const removePart = (productId: string) => setParts((list) => list.filter((p) => p.productId !== productId));

  const totals = useMemo(() => {
    const servicesTotal = services.reduce((sum, s) => sum + amount(s.quantity) * amount(s.unitPrice), 0);
    const partsTotal = parts.reduce((sum, p) => sum + amount(p.quantity) * amount(p.unitPrice), 0);
    const discountValue = staff ? amount(discount) : 0;
    return {
      services: servicesTotal,
      parts: partsTotal,
      discount: discountValue,
      total: Math.max(servicesTotal + partsTotal - discountValue, 0),
    };
  }, [services, parts, discount, staff]);

  /** Envia o pedido. Devolve a solicitação criada ou null se houver erro. */
  const submit = async (): Promise<ServiceRequest | null> => {
    const next: typeof errors = {};
    if (staff && !customer) next.customer = 'Escolha o cliente';
    if (!staff && !profile) next.customer = 'Seu cadastro ainda não carregou. Tente de novo em instantes';
    if (services.length === 0 && description.trim().length < 5) {
      next.description = 'Escolha ao menos um serviço ou descreva o que precisa';
    }
    if ([...services, ...parts].some((line) => !(amount(line.quantity) > 0))) {
      next.lines = 'Informe uma quantidade maior que zero em cada linha';
    } else if (services.some((s) => s.description.trim().length < 2)) {
      next.lines = 'Descreva cada serviço avulso';
    } else if (totals.discount > totals.services + totals.parts) {
      next.lines = 'O desconto não pode ser maior que o total';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return null;

    // O título resume o pedido: os serviços escolhidos ou o começo da descrição
    const names = services.map((s) => s.description.trim()).filter(Boolean);
    const title = (names.length > 0 ? names.join(', ') : description.trim()).slice(0, 160);
    const text = description.trim() || `Serviços solicitados: ${names.join(', ')}.`;

    setSaving(true);
    try {
      const created = await requestsService.create({
        title: title.length >= 3 ? title : `Serviço: ${title}`,
        description: text,
        origin: 'APP',
        vehicleId: vehicle?.id ?? null,
        contractId: contract?.id ?? null,
        ...(staff ? { customerId: customerId ?? null, discount: totals.discount } : {}),
        services: services.map((s) => ({
          serviceId: s.serviceId,
          description: s.description.trim(),
          quantity: amount(s.quantity),
          ...(staff ? { unitPrice: amount(s.unitPrice) } : {}),
        })),
        ...(staff
          ? { items: parts.map((p) => ({ productId: p.productId, quantity: amount(p.quantity), unitPrice: amount(p.unitPrice) })) }
          : {}),
      });
      touchRequests();
      toast.success(staff ? `Serviço ${created.code} registrado` : `Pedido ${created.code} enviado`);
      return created;
    } catch (error) {
      toast.error(error);
      return null;
    } finally {
      setSaving(false);
    }
  };

  return {
    staff,
    customer,
    setCustomer: (next: CustomerSummary | null) => {
      clearError();
      setCustomerState(next);
    },
    vehicles,
    vehicle,
    setVehicle,
    contracts,
    contract,
    setContract: setContractState,
    catalog,
    description,
    setDescription: (value: string) => {
      clearError();
      setDescription(value);
    },
    services,
    toggleService,
    addCustomService,
    patchService,
    removeService,
    parts,
    addPart,
    patchPart,
    removePart,
    discount,
    setDiscount: (value: string) => {
      clearError();
      setDiscount(value);
    },
    totals,
    errors,
    saving,
    submit,
  };
}
