import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useContractOptions, useServiceOptions, useVehicleOptions } from '@/controllers/shared';
import { PRIORITY_LABEL, REQUEST_PRIORITIES } from '@/models/labels';
import type { Product, RequestPriority, Service, ServiceRequest, ServiceRequestInput } from '@/models/types';
import { formatCurrency, formatQuantity, toNumber, vehicleLabel } from '@/utils/format';
import { CustomerPicker, type PickedCustomer } from './CustomerPicker';
import { ProductPicker } from './ProductPicker';
import * as S from './RequestFormDialog.styles';
import { Button, Dialog, DialogFooter, ErrorText, Field, FormGrid, FormStack, Input, Select, Textarea } from './ui';

interface FormValues {
  title: string;
  description: string;
  priority: RequestPriority;
  dueDate: string;
}

interface ServiceDraft {
  key: string;
  serviceId?: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

interface ItemDraft {
  productId: string;
  name: string;
  sku: string;
  unit: string;
  available: number;
  quantity: string;
  unitPrice: string;
}

interface RequestFormDialogProps {
  /** Solicitação em edição; sem ela, o diálogo abre uma nova. */
  request?: ServiceRequest;
  /** Equipe: escolhe cliente, veículo e contrato e lança serviços, valores e desconto. */
  staff: boolean;
  /** Cliente já definido (ex.: ao abrir a partir da tela do cliente). */
  initialCustomer?: PickedCustomer;
  busy: boolean;
  onSubmit: (input: ServiceRequestInput) => void;
  onClose: () => void;
}

const positive = (value: string) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
};
const amount = (value: string) => toNumber(value) ?? 0;
let draftKey = 0;

export function RequestFormDialog({ request, staff, initialCustomer, busy, onSubmit, onClose }: RequestFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: request?.title ?? '',
      description: request?.description ?? '',
      priority: request?.priority ?? 'MEDIUM',
      dueDate: request?.dueDate ?? '',
    },
  });

  const [customer, setCustomer] = useState<PickedCustomer | null>(request?.customer ?? initialCustomer ?? null);
  const [vehicleId, setVehicleId] = useState(request?.vehicleId ?? '');
  const [contractId, setContractId] = useState(request?.contractId ?? '');
  const [discount, setDiscount] = useState(request?.discount ? String(request.discount) : '');
  const [services, setServices] = useState<ServiceDraft[]>(
    () =>
      request?.services?.map((s) => ({
        key: s.id,
        serviceId: s.serviceId ?? undefined,
        description: s.description,
        quantity: String(s.quantity),
        unitPrice: String(s.unitPrice),
      })) ?? [],
  );
  const [items, setItems] = useState<ItemDraft[]>(
    () =>
      request?.items?.map((i) => ({
        productId: i.productId,
        name: i.product?.name ?? 'Produto',
        sku: i.product?.sku ?? '',
        unit: i.product?.unit ?? '',
        available: i.product?.available ?? 0,
        quantity: String(i.quantity),
        unitPrice: String(i.unitPrice),
      })) ?? [],
  );
  const [linesError, setLinesError] = useState('');

  const vehicles = useVehicleOptions(staff ? customer?.id : null);
  const contracts = useContractOptions(staff ? customer?.id : null);
  const catalog = useServiceOptions(contractId || null, staff);

  const changeCustomer = (next: PickedCustomer | null) => {
    setCustomer(next);
    setVehicleId('');
    setContractId('');
  };

  const addService = (service: Service) =>
    setServices((list) => [
      ...list,
      {
        key: `new-${(draftKey += 1)}`,
        serviceId: service.id,
        description: service.name,
        quantity: '1',
        unitPrice: String(service.contractPrice ?? service.price),
      },
    ]);
  const addCustomService = () =>
    setServices((list) => [...list, { key: `new-${(draftKey += 1)}`, description: '', quantity: '1', unitPrice: '' }]);
  const patchService = (key: string, changes: Partial<ServiceDraft>) => {
    setLinesError('');
    setServices((list) => list.map((s) => (s.key === key ? { ...s, ...changes } : s)));
  };

  const addItem = (p: Product) =>
    setItems((list) => [
      ...list,
      {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        available: p.quantity,
        quantity: '1',
        unitPrice: String(p.salePrice ?? 0),
      },
    ]);
  const patchItem = (index: number, changes: Partial<ItemDraft>) => {
    setLinesError('');
    setItems((list) => list.map((it, i) => (i === index ? { ...it, ...changes } : it)));
  };

  const servicesTotal = services.reduce((sum, s) => sum + amount(s.quantity) * amount(s.unitPrice), 0);
  const partsTotal = items.reduce((sum, i) => sum + amount(i.quantity) * amount(i.unitPrice), 0);
  const total = Math.max(servicesTotal + partsTotal - amount(discount), 0);

  const submit = handleSubmit((values) => {
    if (services.some((s) => !positive(s.quantity)) || items.some((i) => !positive(i.quantity))) {
      setLinesError('Informe uma quantidade maior que zero em cada linha');
      return;
    }
    if (services.some((s) => s.description.trim().length < 2)) {
      setLinesError('Descreva cada serviço avulso');
      return;
    }
    if (amount(discount) > servicesTotal + partsTotal) {
      setLinesError('O desconto não pode ser maior que o total');
      return;
    }

    onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      priority: values.priority,
      dueDate: values.dueDate || null,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        ...(staff ? { unitPrice: amount(i.unitPrice) } : {}),
      })),
      ...(staff
        ? {
            customerId: customer?.id ?? null,
            vehicleId: vehicleId || null,
            contractId: contractId || null,
            discount: amount(discount),
            services: services.map((s) => ({
              serviceId: s.serviceId,
              description: s.description.trim(),
              quantity: Number(s.quantity),
              unitPrice: amount(s.unitPrice),
            })),
          }
        : {}),
    });
  });

  const available = catalog.data?.filter((s) => !services.some((line) => line.serviceId === s.id)) ?? [];

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={request ? `Editar ${request.code}` : staff ? 'Registrar serviço' : 'Nova solicitação'}
      description={
        staff
          ? 'Escolha o cliente, lance os serviços e as peças. As peças saem do estoque quando o atendimento for concluído.'
          : 'Descreva o serviço e liste os materiais. Eles saem do estoque quando o atendimento for concluído.'
      }
      size="lg"
    >
      <FormStack onSubmit={submit} noValidate>
        {staff && (
          <>
            <Field label="Cliente" hint="Deixe em branco para uma solicitação interna">
              <CustomerPicker value={customer} onChange={changeCustomer} clearable />
            </Field>
            {customer && (
              <FormGrid>
                <Field label="Veículo ou equipamento" hint={vehicles.data?.length === 0 ? 'Nenhum veículo cadastrado para este cliente' : undefined}>
                  <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                    <option value="">Não informar</option>
                    {vehicles.data?.map((v) => (
                      <option key={v.id} value={v.id}>
                        {vehicleLabel(v)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Contrato" hint={contracts.data?.length === 0 ? 'Cliente sem contrato vigente' : 'Define os valores dos serviços'}>
                  <Select value={contractId} onChange={(e) => setContractId(e.target.value)}>
                    <option value="">Sem contrato (valores do catálogo)</option>
                    {contracts.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.title}
                      </option>
                    ))}
                  </Select>
                </Field>
              </FormGrid>
            )}
          </>
        )}

        <Field label="Título" error={errors.title?.message}>
          <Input
            maxLength={160}
            placeholder={staff ? 'Ex.: Troca dos pneus dianteiros' : 'Ex.: Troca do rolamento da esteira 2'}
            {...register('title', {
              validate: (v) => v.trim().length >= 3 || 'Dê um título com ao menos 3 caracteres',
            })}
          />
        </Field>

        <Field label="Descrição" error={errors.description?.message}>
          <Textarea
            placeholder="O que precisa ser feito, onde e qualquer detalhe que ajude a equipe"
            {...register('description', { validate: (v) => v.trim().length > 0 || 'Descreva o serviço' })}
          />
        </Field>

        <FormGrid>
          <Field label="Prioridade">
            <Select {...register('priority')}>
              {REQUEST_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prazo" hint="Opcional">
            <Input type="date" {...register('dueDate')} />
          </Field>
        </FormGrid>

        {staff && (
          <S.Items>
            <legend>Serviços</legend>
            {services.map((line) => (
              <S.ItemRow key={line.key} $priced>
                <div>
                  {line.serviceId ? (
                    <strong>{line.description}</strong>
                  ) : (
                    <Input
                      placeholder="Descrição do serviço avulso"
                      aria-label="Descrição do serviço"
                      maxLength={200}
                      value={line.description}
                      onChange={(e) => patchService(line.key, { description: e.target.value })}
                    />
                  )}
                </div>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  aria-label={`Quantidade de ${line.description || 'serviço'}`}
                  value={line.quantity}
                  onChange={(e) => patchService(line.key, { quantity: e.target.value })}
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  placeholder="R$"
                  aria-label={`Valor unitário de ${line.description || 'serviço'}`}
                  value={line.unitPrice}
                  onChange={(e) => patchService(line.key, { unitPrice: e.target.value })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${line.description || 'serviço'}`}
                  onClick={() => setServices((list) => list.filter((s) => s.key !== line.key))}
                >
                  <Trash2 />
                </Button>
              </S.ItemRow>
            ))}
            <S.AddRow>
              <Select
                aria-label="Adicionar serviço do catálogo"
                value=""
                onChange={(e) => {
                  const service = catalog.data?.find((s) => s.id === e.target.value);
                  if (service) addService(service);
                }}
              >
                <option value="">
                  {catalog.data?.length === 0 ? 'Nenhum serviço cadastrado no catálogo' : 'Adicionar serviço do catálogo'}
                </option>
                {available.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {formatCurrency(s.contractPrice ?? s.price)}
                  </option>
                ))}
              </Select>
              <Button variant="outline" onClick={addCustomService}>
                <Plus /> Serviço avulso
              </Button>
            </S.AddRow>
          </S.Items>
        )}

        <S.Items>
          <legend>{staff ? 'Peças e materiais do estoque' : 'Materiais do estoque'}</legend>
          {items.map((item, index) => (
            <S.ItemRow key={item.productId} $priced={staff}>
              <div>
                <strong>{item.name}</strong>
                <small data-short={Number(item.quantity) > item.available}>
                  {item.sku} — {formatQuantity(item.available, item.unit)} em estoque
                </small>
              </div>
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                aria-label={`Quantidade de ${item.name}`}
                value={item.quantity}
                onChange={(e) => patchItem(index, { quantity: e.target.value })}
              />
              {staff && (
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  placeholder="R$"
                  aria-label={`Valor unitário de ${item.name}`}
                  value={item.unitPrice}
                  onChange={(e) => patchItem(index, { unitPrice: e.target.value })}
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remover ${item.name}`}
                onClick={() => setItems((list) => list.filter((_, i) => i !== index))}
              >
                <Trash2 />
              </Button>
            </S.ItemRow>
          ))}
          <ProductPicker
            value={null}
            onChange={addItem}
            placeholder={staff ? 'Adicionar peça ou material' : 'Adicionar material'}
            excludeIds={items.map((i) => i.productId)}
          />
        </S.Items>

        {staff && (
          <>
            <FormGrid>
              <Field label="Desconto (R$)" hint="Opcional">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  value={discount}
                  onChange={(e) => {
                    setLinesError('');
                    setDiscount(e.target.value);
                  }}
                />
              </Field>
            </FormGrid>
            <S.Summary>
              <dt>Serviços</dt>
              <dd>{formatCurrency(servicesTotal)}</dd>
              <dt>Peças e materiais</dt>
              <dd>{formatCurrency(partsTotal)}</dd>
              {amount(discount) > 0 && (
                <>
                  <dt>Desconto</dt>
                  <dd>- {formatCurrency(amount(discount))}</dd>
                </>
              )}
              <dt data-total>Total</dt>
              <dd data-total>{formatCurrency(total)}</dd>
            </S.Summary>
          </>
        )}

        {linesError && <ErrorText role="alert">{linesError}</ErrorText>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={busy}>
            {request ? 'Salvar alterações' : staff ? 'Registrar serviço' : 'Abrir solicitação'}
          </Button>
        </DialogFooter>
      </FormStack>
    </Dialog>
  );
}
