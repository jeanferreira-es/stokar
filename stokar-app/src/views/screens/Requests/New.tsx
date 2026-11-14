import { Check, Plus, Trash2, UserPlus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { useTheme } from 'styled-components/native';
import { useToast } from '@/contexts/ToastContext';
import { useNewRequestController, type PartDraft, type ServiceDraft } from '@/controllers/useNewRequestController';
import { catalogService, customersService } from '@/models/services/api';
import type { Customer, Product, Service } from '@/models/types';
import type { RootScreenProps } from '@/navigation/types';
import { formatCurrency, formatDocument, formatQuantity, vehicleLabel } from '@/utils/format';
import {
  Body,
  Button,
  Card,
  Divider,
  Field,
  Fill,
  Input,
  Money,
  Muted,
  OptionsSheet,
  Row,
  Screen,
  SelectButton,
  Stack,
  Strong,
  Subheading,
  TextField,
} from '../../components/ui';
import * as S from './Requests.styles';

type Picker = 'customer' | 'vehicle' | 'contract' | 'part' | null;

/** "Pedir serviço" (cliente) e "Registrar serviço" (equipe). */
export function NewRequestScreen({ navigation, route }: RootScreenProps<'NewRequest'>) {
  const c = useNewRequestController(route.params?.customer);
  const theme = useTheme();
  const [picker, setPicker] = useState<Picker>(null);

  // Ao voltar do cadastro rápido de cliente, ele já vem escolhido
  const returned = route.params?.customer;
  useEffect(() => {
    if (returned) c.setCustomer(returned);
  }, [returned?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    navigation.setOptions({ title: c.staff ? 'Registrar serviço' : 'Pedir serviço' });
  }, [navigation, c.staff]);

  // Catálogo agrupado por tipo de serviço
  const groups = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const service of c.catalog) {
      const name = service.serviceType?.name ?? 'Outros serviços';
      map.set(name, [...(map.get(name) ?? []), service]);
    }
    const OTHERS = 'Outros serviços';
    // Tipos em ordem alfabética, com os serviços sem tipo por último
    return [...map.entries()].sort(([a], [b]) => (a === OTHERS ? 1 : b === OTHERS ? -1 : a.localeCompare(b)));
  }, [c.catalog]);

  const submit = async () => {
    const created = await c.submit();
    if (created) navigation.replace('RequestDetail', { id: created.id });
  };

  const customServices = c.services.filter((s) => !s.serviceId);
  const pickedServices = c.services.filter((s) => s.serviceId);

  return (
    <Screen
      footer={
        <>
          {(c.totals.total > 0 || c.services.length > 0) && (
            <Row $between>
              <Muted>{c.staff ? 'Total' : 'Valor estimado'}</Muted>
              <Money>{formatCurrency(c.totals.total)}</Money>
            </Row>
          )}
          <Button label={c.staff ? 'Registrar serviço' : 'Enviar pedido'} loading={c.saving} onPress={() => void submit()} />
        </>
      }
    >
      {c.staff && (
        <Card>
          <Field label="Cliente" error={c.errors.customer}>
            <SelectButton
              value={c.customer ? c.customer.tradeName || c.customer.name : undefined}
              placeholder="Escolher cliente"
              onPress={() => setPicker('customer')}
            />
          </Field>
        </Card>
      )}
      {!c.staff && c.errors.customer ? <Muted style={{ color: theme.colors.danger }}>{c.errors.customer}</Muted> : null}

      {(!c.staff || c.customer) && (
        <Card>
          <Field
            label="Veículo ou equipamento"
            hint={c.vehicles.length === 0 ? (c.staff ? 'Cliente sem veículos cadastrados' : 'Cadastre seus veículos em Conta > Meus veículos') : undefined}
          >
            <SelectButton
              value={c.vehicle ? vehicleLabel(c.vehicle) : undefined}
              placeholder="Não informar"
              disabled={c.vehicles.length === 0}
              onPress={() => setPicker('vehicle')}
            />
          </Field>
          {c.contracts.length > 0 && (
            <Field label="Contrato" hint="Define os valores dos serviços">
              <SelectButton
                value={c.contract ? `${c.contract.code} — ${c.contract.title}` : undefined}
                placeholder="Sem contrato"
                onPress={() => setPicker('contract')}
              />
            </Field>
          )}
        </Card>
      )}

      <Card>
        <Subheading>{c.staff ? 'Serviços' : 'O que você precisa?'}</Subheading>
        {c.catalog.length === 0 && <Muted>A oficina ainda não publicou o catálogo. Descreva o que precisa no campo abaixo.</Muted>}
        {groups.map(([group, services]) => (
          <Stack key={group} $gap={2}>
            {groups.length > 1 && <S.GroupTitle>{group}</S.GroupTitle>}
            {services.map((service) => {
              const selected = c.services.some((s) => s.serviceId === service.id);
              return (
                <Pressable
                  key={service.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${service.name}, ${formatCurrency(service.contractPrice ?? service.price)}`}
                  onPress={() => c.toggleService(service)}
                >
                  {({ pressed }) => (
                    <S.ServiceOption $selected={selected} $pressed={pressed}>
                      <S.Check $selected={selected}>{selected && <Check size={14} color={theme.colors.primaryFg} />}</S.Check>
                      <Fill>
                        <Strong>{service.name}</Strong>
                        {service.description ? <Muted numberOfLines={2}>{service.description}</Muted> : null}
                      </Fill>
                      <Body>{formatCurrency(service.contractPrice ?? service.price)}</Body>
                    </S.ServiceOption>
                  )}
                </Pressable>
              );
            })}
          </Stack>
        ))}

        {c.staff && pickedServices.length > 0 && (
          <>
            <Divider />
            <Muted>Quantidade e valor dos serviços escolhidos</Muted>
            {pickedServices.map((line) => (
              <ServiceLine key={line.key} line={line} onChange={c.patchService} onRemove={c.removeService} />
            ))}
          </>
        )}
        {c.staff && (
          <>
            {customServices.map((line) => (
              <ServiceLine key={line.key} line={line} custom onChange={c.patchService} onRemove={c.removeService} />
            ))}
            <Button label="Serviço avulso" variant="outline" icon={Plus} onPress={c.addCustomService} />
          </>
        )}
      </Card>

      {c.staff && (
        <Card>
          <Subheading>Peças do estoque</Subheading>
          {c.parts.length === 0 && <Muted>Opcional. As peças saem do estoque quando o serviço for concluído.</Muted>}
          {c.parts.map((part) => (
            <PartLine key={part.productId} part={part} onChange={c.patchPart} onRemove={c.removePart} />
          ))}
          <Button label="Adicionar peça" variant="outline" icon={Plus} onPress={() => setPicker('part')} />
          <TextField
            label="Desconto (R$)"
            hint="Opcional"
            value={c.discount}
            onChangeText={c.setDiscount}
            keyboardType="decimal-pad"
          />
        </Card>
      )}

      <Card>
        <TextField
          label={c.staff ? 'Observações' : 'Conte mais detalhes'}
          hint={c.staff ? 'O que o cliente relatou, combinados e o que mais ajudar a equipe' : 'Ex.: barulho ao frear, melhor horário para deixar o veículo'}
          error={c.errors.description}
          value={c.description}
          onChangeText={c.setDescription}
          multiline
          maxLength={10000}
        />
        {c.errors.lines ? <Muted style={{ color: theme.colors.danger }}>{c.errors.lines}</Muted> : null}
        {!c.staff && <Muted>A oficina confirma o valor final ao aprovar o pedido. Peças, se necessárias, são incluídas por ela.</Muted>}
      </Card>

      {/* ---------- Seletores ---------- */}
      <CustomerSheet
        visible={picker === 'customer'}
        selectedId={c.customer?.id}
        onClose={() => setPicker(null)}
        onSelect={(customer) => {
          c.setCustomer(customer);
          setPicker(null);
        }}
        onCreate={() => {
          setPicker(null);
          navigation.navigate('CustomerForm');
        }}
      />
      <OptionsSheet
        visible={picker === 'vehicle'}
        onClose={() => setPicker(null)}
        title="Veículo ou equipamento"
        selectedKey={c.vehicle?.id ?? 'none'}
        options={[
          { key: 'none', label: 'Não informar', value: null },
          ...c.vehicles.map((v) => ({ key: v.id, label: vehicleLabel(v), description: v.color ?? undefined, value: v })),
        ]}
        onSelect={(vehicle) => {
          c.setVehicle(vehicle);
          setPicker(null);
        }}
      />
      <OptionsSheet
        visible={picker === 'contract'}
        onClose={() => setPicker(null)}
        title="Contrato"
        description="Com contrato, os serviços usam os valores negociados."
        selectedKey={c.contract?.id ?? 'none'}
        options={[
          { key: 'none', label: 'Sem contrato', description: 'Valores do catálogo', value: null },
          ...c.contracts.map((ct) => ({ key: ct.id, label: ct.title, description: ct.code, value: ct })),
        ]}
        onSelect={(contract) => {
          c.setContract(contract);
          setPicker(null);
        }}
      />
      <ProductSheet
        visible={picker === 'part'}
        excludeIds={c.parts.map((p) => p.productId)}
        onClose={() => setPicker(null)}
        onSelect={(product) => {
          c.addPart(product);
          setPicker(null);
        }}
      />
    </Screen>
  );
}

function ServiceLine(props: {
  line: ServiceDraft;
  custom?: boolean;
  onChange: (key: string, changes: Partial<ServiceDraft>) => void;
  onRemove: (key: string) => void;
}) {
  const { line } = props;
  return (
    <S.LineBox>
      {props.custom ? (
        <Input
          placeholder="Descrição do serviço avulso"
          accessibilityLabel="Descrição do serviço avulso"
          value={line.description}
          onChangeText={(description) => props.onChange(line.key, { description })}
          maxLength={200}
        />
      ) : (
        <Strong>{line.description}</Strong>
      )}
      <Row>
        <Fill>
          <Input
            accessibilityLabel={`Quantidade de ${line.description || 'serviço'}`}
            placeholder="Qtd."
            keyboardType="decimal-pad"
            value={line.quantity}
            onChangeText={(quantity) => props.onChange(line.key, { quantity })}
          />
        </Fill>
        <Fill style={{ flex: 1.4 }}>
          <Input
            accessibilityLabel={`Valor unitário de ${line.description || 'serviço'}`}
            placeholder="Valor (R$)"
            keyboardType="decimal-pad"
            value={line.unitPrice}
            onChangeText={(unitPrice) => props.onChange(line.key, { unitPrice })}
          />
        </Fill>
        <Button label="" accessibilityLabel={`Remover ${line.description || 'serviço'}`} variant="ghost" icon={Trash2} fullWidth={false} onPress={() => props.onRemove(line.key)} />
      </Row>
    </S.LineBox>
  );
}

function PartLine(props: {
  part: PartDraft;
  onChange: (productId: string, changes: Partial<PartDraft>) => void;
  onRemove: (productId: string) => void;
}) {
  const { part } = props;
  const theme = useTheme();
  const short = Number(part.quantity.replace(',', '.')) > part.available;
  return (
    <S.LineBox>
      <Strong>{part.name}</Strong>
      <Muted style={short ? { color: theme.colors.danger } : undefined}>{formatQuantity(part.available, part.unit)} em estoque</Muted>
      <Row>
        <Fill>
          <Input
            accessibilityLabel={`Quantidade de ${part.name}`}
            placeholder="Qtd."
            keyboardType="decimal-pad"
            value={part.quantity}
            onChangeText={(quantity) => props.onChange(part.productId, { quantity })}
          />
        </Fill>
        <Fill style={{ flex: 1.4 }}>
          <Input
            accessibilityLabel={`Valor unitário de ${part.name}`}
            placeholder="Valor (R$)"
            keyboardType="decimal-pad"
            value={part.unitPrice}
            onChangeText={(unitPrice) => props.onChange(part.productId, { unitPrice })}
          />
        </Fill>
        <Button label="" accessibilityLabel={`Remover ${part.name}`} variant="ghost" icon={Trash2} fullWidth={false} onPress={() => props.onRemove(part.productId)} />
      </Row>
    </S.LineBox>
  );
}

/** Busca com atraso curto, para não chamar a API a cada tecla. */
function useSearch<T>(visible: boolean, fetcher: (term: string) => Promise<T[]>) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      fetcher(search.trim())
        .then((result) => active && setItems(result))
        .catch((error: unknown) => active && toast.error(error))
        .finally(() => active && setLoading(false));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [visible, search]); // eslint-disable-line react-hooks/exhaustive-deps

  return { search, setSearch, items, loading };
}

function CustomerSheet(props: {
  visible: boolean;
  selectedId?: string;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  onCreate: () => void;
}) {
  const s = useSearch(props.visible, customersService.search);
  return (
    <OptionsSheet
      visible={props.visible}
      onClose={props.onClose}
      title="Cliente"
      selectedKey={props.selectedId}
      header={
        <Input
          placeholder="Buscar por nome, CPF/CNPJ ou e-mail"
          accessibilityLabel="Buscar cliente"
          value={s.search}
          onChangeText={s.setSearch}
          autoCorrect={false}
        />
      }
      options={s.items.map((customer) => ({
        key: customer.id,
        label: customer.tradeName || customer.name,
        description: customer.tradeName ? customer.name : (customer.phone ?? undefined),
        right: formatDocument(customer.document),
        value: customer,
      }))}
      emptyText={s.loading ? 'Buscando…' : 'Nenhum cliente encontrado.'}
      onSelect={props.onSelect}
      footer={<Button label="Cadastrar novo cliente" variant="outline" icon={UserPlus} onPress={props.onCreate} />}
    />
  );
}

function ProductSheet(props: { visible: boolean; excludeIds: string[]; onClose: () => void; onSelect: (product: Product) => void }) {
  const s = useSearch(props.visible, catalogService.products);
  return (
    <OptionsSheet
      visible={props.visible}
      onClose={props.onClose}
      title="Adicionar peça"
      header={
        <Input placeholder="Buscar por nome ou SKU" accessibilityLabel="Buscar peça" value={s.search} onChangeText={s.setSearch} autoCorrect={false} />
      }
      options={s.items
        .filter((p) => !props.excludeIds.includes(p.id))
        .map((p) => ({
          key: p.id,
          label: p.name,
          description: `${p.sku} · ${formatQuantity(p.quantity, p.unit)} em estoque`,
          right: formatCurrency(p.salePrice ?? 0),
          value: p,
        }))}
      emptyText={s.loading ? 'Buscando…' : 'Nenhuma peça encontrada.'}
      onSelect={props.onSelect}
    />
  );
}
